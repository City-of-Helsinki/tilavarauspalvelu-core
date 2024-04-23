import datetime

import pytest
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice
from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
)

DEFAULT_TIMEZONE = get_default_timezone()


def _get_date(*, month=1, day=1) -> datetime.date:
    return datetime.date(2022, month, day)


def _get_dt(*, month=1, day=1, hour=None, minute=0) -> datetime.datetime:
    return datetime.datetime(2022, month, day, hour, minute, 0, tzinfo=DEFAULT_TIMEZONE)


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory(id="999")
    reservation_unit = ReservationUnitFactory(
        origin_hauki_resource=origin_hauki_resource,
        spaces=[SpaceFactory()],
    )

    ApplicationRoundFactory(
        reservation_units=[reservation_unit],
        reservation_period_begin=_get_date(month=8, day=1),
        reservation_period_end=_get_date(month=12, day=31),
        application_period_begin=_get_dt(month=4, day=1, hour=9),
        application_period_end=_get_dt(month=4, day=30, hour=16),
    )
    ReservationFactory(
        begin=_get_dt(month=4, day=15, hour=12),
        end=_get_dt(month=4, day=15, hour=14),
        reservation_unit=[reservation_unit],
        state=ReservationStateChoice.CREATED.value,
    )

    return reservation_unit


@pytest.mark.django_db()
@freeze_time("2022-01-01")
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times(reservation_unit):
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=1, hour=10),
        end_datetime=_get_dt(month=1, day=1, hour=22),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=2, hour=10),
        end_datetime=_get_dt(month=1, day=2, hour=22),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=7, day=1, hour=10),
        end_datetime=_get_dt(month=7, day=1, hour=22),
    )

    possible_start_times = reservation_unit.actions.get_possible_start_times(
        from_date=_get_date(month=1, day=1),
        interval_minutes=90,
    )

    assert possible_start_times == {
        _get_dt(month=1, day=1, hour=10, minute=0),
        _get_dt(month=1, day=1, hour=11, minute=30),
        _get_dt(month=1, day=1, hour=13, minute=0),
        _get_dt(month=1, day=1, hour=14, minute=30),
        _get_dt(month=1, day=1, hour=16, minute=0),
        _get_dt(month=1, day=1, hour=17, minute=30),
        _get_dt(month=1, day=1, hour=19, minute=0),
        _get_dt(month=1, day=1, hour=20, minute=30),
        _get_dt(month=1, day=1, hour=20, minute=30),
    }
