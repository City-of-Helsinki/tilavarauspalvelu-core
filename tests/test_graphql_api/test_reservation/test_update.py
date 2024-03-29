from datetime import datetime, timedelta

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import (
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.test_graphql_api.test_reservation.helpers import (
    ADJUST_MUTATION,
)

DEFAULT_TIMEZONE = get_default_timezone()

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_reservation_email_sending"),
]


@freezegun.freeze_time("2021-01-01")
def test_update_reservation__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=timedelta(hours=0),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
        handled_at=None,
    )

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_update_reservation__update_reservation_buffer_on_adjust(graphql):
    reservation_unit = ReservationUnitFactory.create(
        buffer_time_before=timedelta(hours=1),
        buffer_time_after=timedelta(hours=1),
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=timedelta(hours=0),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
        handled_at=None,
    )

    # Changing the reservation unit buffers. These should be applied to the reservation when it is adjusted.
    reservation_unit.buffer_time_before = timedelta(hours=2)
    reservation_unit.buffer_time_after = timedelta(hours=2)
    reservation_unit.save()

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    # New reservation unit buffers are applied automatically on adjust.
    assert reservation.buffer_time_before == timedelta(hours=2)
    assert reservation.buffer_time_after == timedelta(hours=2)
