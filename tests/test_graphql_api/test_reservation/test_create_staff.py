from datetime import datetime, timedelta

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import timedelta_to_json
from reservations.choices import ReservationTypeChoice
from reservations.models import Reservation
from tests.factories import (
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.test_graphql_api.test_reservation.helpers import CREATE_STAFF_MUTATION

DEFAULT_TIMEZONE = get_default_timezone()

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_reservation_email_sending"),
]


@freezegun.freeze_time("2021-01-01")
def test_create_staff_reservation__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "begin": datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_create_staff_reservation__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "begin": datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
        "bufferTimeBefore": timedelta_to_json(timedelta(hours=1)),
        "bufferTimeAfter": timedelta_to_json(timedelta(hours=1)),
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)
