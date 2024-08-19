from datetime import datetime, timedelta

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import timedelta_to_json
from reservations.enums import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import (
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.test_graphql_api.test_reservation.helpers import ADJUST_STAFF_MUTATION

DEFAULT_TIMEZONE = get_default_timezone()

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_update__reservation_block_whole_day(graphql):
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
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_update__reservation_block_whole_day__ignore_given_buffers(graphql):
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
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "bufferTimeBefore": timedelta_to_json(timedelta(hours=1)),
        "bufferTimeAfter": timedelta_to_json(timedelta(hours=1)),
    }

    response = graphql(ADJUST_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)
