from datetime import UTC, datetime

import pytest
from django.utils.timezone import get_current_timezone

from opening_hours.utils.reservable_time_span_client import TimeSpanElement
from reservation_units.models import ReservationUnit
from reservations.models import Reservation
from tests.factories import (
    ReservationFactory,
    ReservationUnitFactory,
    ResourceFactory,
    SpaceFactory,
    UnitFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

DEFAULT_TIMEZONE = get_current_timezone()


def _datetime(year=2023, month=5, day=1, hour=0, minute=0) -> datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime(year, month, day, hour, minute, tzinfo=DEFAULT_TIMEZONE).astimezone(UTC)


def _create_test_reservations_for_all_reservation_units() -> None:
    """
    Create test reservations for all ReservationUnits.

    The ReservationUnit's ID is as the minute for the Reservations begin datetime.
    Due to the TimeSpanElements returned by `as_closed_time_spans` not including any identifying information about
    the reservations, we need to do this is so that the TimeSpanElements can be distinguished from each other,
    which is a requirement for testing and helps a lot with debugging.
    """
    for reservation_unit in ReservationUnit.objects.all():
        ReservationFactory(
            begin=_datetime(minute=reservation_unit.id),
            end=_datetime(minute=0),
            reservation_unit=[reservation_unit],
            user=None,
        )


def _validate_time_spans(
    all_closed_time_spans: dict[int, list[TimeSpanElement]],
    reservation_unit_id: int,
    related_reservation_unit_ids: list[int],
) -> None:
    """
    Validate that the given ReservationUnit has the expected closed time spans generated from related ReservationUnits.

    :param all_closed_time_spans: The result of `Reservation.objects.as_closed_time_spans`.
    :param reservation_unit_id: The id of the ReservationUnit to validate.
    :param related_reservation_unit_ids: The ids of the ReservationUnits that should be related to the ReservationUnit.
    """
    closed_time_spans: set[TimeSpanElement] = {
        TimeSpanElement(
            start_datetime=reservation.buffered_begin,
            end_datetime=reservation.buffered_end,
            is_reservable=False,
        )
        for reservation in Reservation.objects.with_buffered_begin_and_end().filter(
            reservation_unit__pk__in=related_reservation_unit_ids + [reservation_unit_id]
        )
    }

    assert all_closed_time_spans[reservation_unit_id] == closed_time_spans


def test__get_affecting_reservations__only_resources():
    # Resource 1 <- ReservationUnit 1, 2
    # Resource 2 <- ReservationUnit 3, 4
    # Resource 2 <- ReservationUnit 5
    resource_1 = ResourceFactory(id=1)
    resource_2 = ResourceFactory(id=2)
    resource_3 = ResourceFactory(id=3)

    unit_1 = UnitFactory(id=1)
    ReservationUnitFactory(id=1, unit=unit_1, resources=[resource_1])
    ReservationUnitFactory(id=2, unit=unit_1, resources=[resource_1])
    ReservationUnitFactory(id=3, unit=unit_1, resources=[resource_2])

    unit_2 = UnitFactory(id=2)
    ReservationUnitFactory(id=4, unit=unit_2, resources=[resource_2])
    ReservationUnitFactory(id=5, unit=unit_2, resources=[resource_3])

    _create_test_reservations_for_all_reservation_units()

    all_closed_time_spans = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
        reservation_unit_queryset=ReservationUnit.objects.all(),
        start_date=_datetime(month=1).date(),
        end_date=_datetime(month=12).date(),
    )

    _validate_time_spans(all_closed_time_spans, 1, [2])
    _validate_time_spans(all_closed_time_spans, 2, [1])
    _validate_time_spans(all_closed_time_spans, 3, [4])

    _validate_time_spans(all_closed_time_spans, 4, [3])
    _validate_time_spans(all_closed_time_spans, 5, [])


def test__get_affecting_reservations__only_spaces():
    # Space 1                    <- ReservationUnit 1, 8
    # ├── Space 1.1              <- ReservationUnit 2
    # │   ├── Space 1.1.1        <- ReservationUnit 4
    # │   │   └── Space 1.1.1.1  <- ReservationUnit 6
    # │   └── Space 1.1.2        <- ReservationUnit 5
    # └── Space 1.2              <- ReservationUnit 3
    # Space 2                    <- ReservationUnit 7
    space_1 = SpaceFactory(id=1, parent=None)
    space_1_1 = SpaceFactory(id=2, parent=space_1)
    space_1_2 = SpaceFactory(id=3, parent=space_1)
    space_1_1_1 = SpaceFactory(id=4, parent=space_1_1)
    space_1_1_2 = SpaceFactory(id=5, parent=space_1_1)
    space_1_1_1_1 = SpaceFactory(id=6, parent=space_1_1_1)
    space_2 = SpaceFactory(id=7, parent=None)

    unit_1 = UnitFactory(id=1)
    ReservationUnitFactory(id=1, unit=unit_1, spaces=[space_1])
    ReservationUnitFactory(id=2, unit=unit_1, spaces=[space_1_1])
    ReservationUnitFactory(id=3, unit=unit_1, spaces=[space_1_2])
    ReservationUnitFactory(id=4, unit=unit_1, spaces=[space_1_1_1])
    ReservationUnitFactory(id=5, unit=unit_1, spaces=[space_1_1_2])
    ReservationUnitFactory(id=6, unit=unit_1, spaces=[space_1_1_1_1])
    ReservationUnitFactory(id=7, unit=unit_1, spaces=[space_2])

    unit_2 = UnitFactory(id=2)
    ReservationUnitFactory(id=8, unit=unit_2, spaces=[space_1])

    _create_test_reservations_for_all_reservation_units()

    all_closed_time_spans = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
        reservation_unit_queryset=ReservationUnit.objects.all(),
        start_date=_datetime(month=1).date(),
        end_date=_datetime(month=12).date(),
    )

    _validate_time_spans(all_closed_time_spans, 1, [2, 3, 4, 5, 6, 8])
    _validate_time_spans(all_closed_time_spans, 2, [1, 4, 5, 6, 8])
    _validate_time_spans(all_closed_time_spans, 3, [1, 8])
    _validate_time_spans(all_closed_time_spans, 4, [1, 2, 6, 8])
    _validate_time_spans(all_closed_time_spans, 5, [1, 2, 8])
    _validate_time_spans(all_closed_time_spans, 6, [1, 2, 4, 8])
    _validate_time_spans(all_closed_time_spans, 7, [])

    _validate_time_spans(all_closed_time_spans, 8, [1, 2, 3, 4, 5, 6])


def test__get_affecting_reservations__resources_and_spaces():
    # Space 1             <- ReservationUnit 5
    # ├── Space 1.1       <- ReservationUnit 1, 3
    # │   └── Space 1.1.1 <- ReservationUnit 4
    # └── Space 1.2       <- ReservationUnit 6
    space_1 = SpaceFactory(id=1, parent=None)
    space_1_1 = SpaceFactory(id=2, parent=space_1)
    space_1_1_1 = SpaceFactory(id=3, parent=space_1_1)
    space_1_2 = SpaceFactory(id=4, parent=space_1)

    # Resource 1 <- ReservationUnit 1, 2
    # Resource 2 <- ReservationUnit 7
    resource_1 = ResourceFactory(id=1)
    resource_2 = ResourceFactory(id=2)

    unit = UnitFactory(id=1)
    ReservationUnitFactory(id=1, unit=unit, spaces=[space_1_1], resources=[resource_1])
    ReservationUnitFactory(id=2, unit=unit, spaces=[], resources=[resource_1])
    ReservationUnitFactory(id=3, unit=unit, spaces=[space_1_1], resources=[])
    ReservationUnitFactory(id=4, unit=unit, spaces=[space_1_1_1], resources=[])
    ReservationUnitFactory(id=5, unit=unit, spaces=[space_1], resources=[])
    ReservationUnitFactory(id=6, unit=unit, spaces=[space_1_2], resources=[])
    ReservationUnitFactory(id=7, unit=unit, spaces=[], resources=[resource_2])
    ReservationUnitFactory(id=8, unit=unit, spaces=[], resources=[])

    _create_test_reservations_for_all_reservation_units()

    all_closed_time_spans = Reservation.objects.get_affecting_reservations_as_closed_time_spans(
        reservation_unit_queryset=ReservationUnit.objects.all(),
        start_date=_datetime(month=1).date(),
        end_date=_datetime(month=12).date(),
    )

    _validate_time_spans(all_closed_time_spans, 1, [2, 3, 4, 5])
    _validate_time_spans(all_closed_time_spans, 2, [1])
    _validate_time_spans(all_closed_time_spans, 3, [1, 4, 5])
    _validate_time_spans(all_closed_time_spans, 4, [1, 3, 5])
    _validate_time_spans(all_closed_time_spans, 5, [1, 3, 4, 6])
    _validate_time_spans(all_closed_time_spans, 6, [5])
    _validate_time_spans(all_closed_time_spans, 7, [])
    _validate_time_spans(all_closed_time_spans, 8, [])
