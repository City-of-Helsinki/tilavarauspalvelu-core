from __future__ import annotations

import datetime
from collections import defaultdict

import pytest

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.models import AffectingTimeSpan, Reservation, ReservationUnit, ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, local_date

from tests.factories import ReservationFactory, ReservationUnitFactory, ResourceFactory, SpaceFactory, UnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

NEXT_YEAR = local_date().year + 1


def _datetime(year=NEXT_YEAR, month=5, day=1, hour=0, minute=0) -> datetime.datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime.datetime(year, month, day, hour, minute, tzinfo=DEFAULT_TIMEZONE).astimezone(datetime.UTC)


def _create_test_reservations_for_all_reservation_units() -> None:
    """
    Create test reservations for all ReservationUnits.

    Use the ReservationUnit's creation order as the minute for the Reservation's begin datetime.
    Due to the TimeSpanElements returned by `as_closed_time_spans` not including any identifying information about
    the reservations, we need to do this is so that the TimeSpanElements can be distinguished from each other,
    which is a requirement for testing and helps a lot with debugging.
    """
    for i, reservation_unit in enumerate(ReservationUnit.objects.order_by("pk").all(), start=1):
        ReservationFactory.create(
            begins_at=_datetime(minute=i),
            ends_at=_datetime(minute=0),
            reservation_units=[reservation_unit],
            user=None,
            state=ReservationStateChoice.CREATED,
            type=ReservationTypeChoice.NORMAL,
        )


def _validate_time_spans(
    all_closed_time_spans: dict[int, set[TimeSpanElement]],
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
            start_datetime=reservation.buffered_begins_at,
            end_datetime=reservation.buffered_ends_at,
            is_reservable=False,
        )
        for reservation in Reservation.objects.with_buffered_begin_and_end().filter(
            reservation_units__pk__in=[*related_reservation_unit_ids, reservation_unit_id]
        )
    }

    assert all_closed_time_spans.get(reservation_unit_id) == closed_time_spans


def test__get_affecting_reservations__only_resources():
    # Resource 1 <- ReservationUnit 1, 2
    # Resource 2 <- ReservationUnit 3, 4
    # Resource 3 <- ReservationUnit 5
    resource_1 = ResourceFactory.create(name="1")
    resource_2 = ResourceFactory.create(name="2")
    resource_3 = ResourceFactory.create(name="3")

    unit_1 = UnitFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1, resources=[resource_1])
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_1, resources=[resource_1])
    reservation_unit_3 = ReservationUnitFactory.create(unit=unit_1, resources=[resource_2])

    unit_2 = UnitFactory.create()
    reservation_unit_4 = ReservationUnitFactory.create(unit=unit_2, resources=[resource_2])
    reservation_unit_5 = ReservationUnitFactory.create(unit=unit_2, resources=[resource_3])

    _create_test_reservations_for_all_reservation_units()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    all_closed_time_spans: dict[int, set[TimeSpanElement]] = defaultdict(set)
    for timespan in AffectingTimeSpan.objects.all():
        element = timespan.as_time_span_element()
        for reservation_unit_id in timespan.affected_reservation_unit_ids:
            all_closed_time_spans[reservation_unit_id].add(element)

    _validate_time_spans(all_closed_time_spans, reservation_unit_1.pk, [reservation_unit_2.pk])
    _validate_time_spans(all_closed_time_spans, reservation_unit_2.pk, [reservation_unit_1.pk])
    _validate_time_spans(all_closed_time_spans, reservation_unit_3.pk, [reservation_unit_4.pk])
    _validate_time_spans(all_closed_time_spans, reservation_unit_4.pk, [reservation_unit_3.pk])
    _validate_time_spans(all_closed_time_spans, reservation_unit_5.pk, [])


def test__get_affecting_reservations__only_spaces():
    # Space 1                    <- ReservationUnit 1, 8
    # ├── Space 1.1              <- ReservationUnit 2
    # │   ├── Space 1.1.1        <- ReservationUnit 4
    # │   │   └── Space 1.1.1.1  <- ReservationUnit 6
    # │   └── Space 1.1.2        <- ReservationUnit 5
    # └── Space 1.2              <- ReservationUnit 3
    # Space 2                    <- ReservationUnit 7
    space_1 = SpaceFactory.create(name="1", parent=None)
    space_1_1 = SpaceFactory.create(name="2", parent=space_1)
    space_1_2 = SpaceFactory.create(name="3", parent=space_1)
    space_1_1_1 = SpaceFactory.create(name="4", parent=space_1_1)
    space_1_1_2 = SpaceFactory.create(name="5", parent=space_1_1)
    space_1_1_1_1 = SpaceFactory.create(name="6", parent=space_1_1_1)
    space_2 = SpaceFactory.create(name="7", parent=None)

    unit_1 = UnitFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1])
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1_1])
    reservation_unit_3 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1_2])
    reservation_unit_4 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1_1_1])
    reservation_unit_5 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1_1_2])
    reservation_unit_6 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_1_1_1_1])
    reservation_unit_7 = ReservationUnitFactory.create(unit=unit_1, spaces=[space_2])

    unit_2 = UnitFactory.create()
    reservation_unit_8 = ReservationUnitFactory.create(unit=unit_2, spaces=[space_1])

    _create_test_reservations_for_all_reservation_units()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    all_closed_time_spans: dict[int, set[TimeSpanElement]] = defaultdict(set)
    for timespan in AffectingTimeSpan.objects.all():
        element = timespan.as_time_span_element()
        for reservation_unit_id in timespan.affected_reservation_unit_ids:
            all_closed_time_spans[reservation_unit_id].add(element)

    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_1.pk,
        [
            reservation_unit_2.pk,
            reservation_unit_3.pk,
            reservation_unit_4.pk,
            reservation_unit_5.pk,
            reservation_unit_6.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_2.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_4.pk,
            reservation_unit_5.pk,
            reservation_unit_6.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_3.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_4.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_2.pk,
            reservation_unit_6.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_5.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_2.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_6.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_2.pk,
            reservation_unit_4.pk,
            reservation_unit_8.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_7.pk,
        [],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_8.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_2.pk,
            reservation_unit_3.pk,
            reservation_unit_4.pk,
            reservation_unit_5.pk,
            reservation_unit_6.pk,
        ],
    )


def test__get_affecting_reservations__resources_and_spaces():
    # Space 1             <- ReservationUnit 5
    # ├── Space 1.1       <- ReservationUnit 1, 3
    # │   └── Space 1.1.1 <- ReservationUnit 4
    # └── Space 1.2       <- ReservationUnit 6
    space_1 = SpaceFactory.create(name="1", parent=None)
    space_1_1 = SpaceFactory.create(name="2", parent=space_1)
    space_1_1_1 = SpaceFactory.create(name="3", parent=space_1_1)
    space_1_2 = SpaceFactory.create(name="4", parent=space_1)

    # Resource 1 <- ReservationUnit 1, 2
    # Resource 2 <- ReservationUnit 7
    resource_1 = ResourceFactory.create()
    resource_2 = ResourceFactory.create()

    unit = UnitFactory.create()
    reservation_unit_1 = ReservationUnitFactory.create(unit=unit, spaces=[space_1_1], resources=[resource_1])
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit, spaces=[], resources=[resource_1])
    reservation_unit_3 = ReservationUnitFactory.create(unit=unit, spaces=[space_1_1], resources=[])
    reservation_unit_4 = ReservationUnitFactory.create(unit=unit, spaces=[space_1_1_1], resources=[])
    reservation_unit_5 = ReservationUnitFactory.create(unit=unit, spaces=[space_1], resources=[])
    reservation_unit_6 = ReservationUnitFactory.create(unit=unit, spaces=[space_1_2], resources=[])
    reservation_unit_7 = ReservationUnitFactory.create(unit=unit, spaces=[], resources=[resource_2])
    reservation_unit_8 = ReservationUnitFactory.create(unit=unit, spaces=[], resources=[])

    _create_test_reservations_for_all_reservation_units()

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    all_closed_time_spans: dict[int, set[TimeSpanElement]] = defaultdict(set)
    for timespan in AffectingTimeSpan.objects.all():
        element = timespan.as_time_span_element()
        for reservation_unit_id in timespan.affected_reservation_unit_ids:
            all_closed_time_spans[reservation_unit_id].add(element)

    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_1.pk,
        [
            reservation_unit_2.pk,
            reservation_unit_3.pk,
            reservation_unit_4.pk,
            reservation_unit_5.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_2.pk,
        [
            reservation_unit_1.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_3.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_4.pk,
            reservation_unit_5.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_4.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_3.pk,
            reservation_unit_5.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_5.pk,
        [
            reservation_unit_1.pk,
            reservation_unit_3.pk,
            reservation_unit_4.pk,
            reservation_unit_6.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_6.pk,
        [
            reservation_unit_5.pk,
        ],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_7.pk,
        [],
    )
    _validate_time_spans(
        all_closed_time_spans,
        reservation_unit_8.pk,
        [],
    )
