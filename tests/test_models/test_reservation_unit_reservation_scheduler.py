from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit


def _get_date(*, month=1, day=1) -> datetime.date:
    return datetime.date(2022, month, day)


def _get_dt(*, month=1, day=1, hour=None, minute=0) -> datetime.datetime:
    return datetime.datetime(2022, month, day, hour, minute, 0, tzinfo=DEFAULT_TIMEZONE)


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory.create(id=999)
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=origin_hauki_resource,
        spaces=[SpaceFactory.create()],
    )

    ApplicationRoundFactory.create(
        reservation_units=[reservation_unit],
        reservation_period_begin=_get_date(month=8, day=1),
        reservation_period_end=_get_date(month=12, day=31),
        application_period_begin=_get_dt(month=4, day=1, hour=9),
        application_period_end=_get_dt(month=4, day=30, hour=16),
    )
    ReservationFactory.create(
        begin=_get_dt(month=4, day=15, hour=12),
        end=_get_dt(month=4, day=15, hour=14),
        reservation_units=[reservation_unit],
        state=ReservationStateChoice.CREATED.value,
    )

    return reservation_unit


@pytest.mark.django_db
@freeze_time("2022-01-01")
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times(reservation_unit):
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=1, hour=10),
        end_datetime=_get_dt(month=1, day=1, hour=22),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=2, hour=10),
        end_datetime=_get_dt(month=1, day=2, hour=22),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=7, day=1, hour=10),
        end_datetime=_get_dt(month=7, day=1, hour=22),
    )

    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_90_MINUTES
    reservation_unit.save()

    possible_start_times = reservation_unit.actions.get_possible_start_times(on_date=_get_date(month=1, day=1))

    expected = {
        _get_dt(month=1, day=1, hour=10, minute=0).time(),
        _get_dt(month=1, day=1, hour=11, minute=30).time(),
        _get_dt(month=1, day=1, hour=13, minute=0).time(),
        _get_dt(month=1, day=1, hour=14, minute=30).time(),
        _get_dt(month=1, day=1, hour=16, minute=0).time(),
        _get_dt(month=1, day=1, hour=17, minute=30).time(),
        _get_dt(month=1, day=1, hour=19, minute=0).time(),
        _get_dt(month=1, day=1, hour=20, minute=30).time(),
        _get_dt(month=1, day=1, hour=20, minute=30).time(),
    }

    # All possible start times are in the expected set
    assert possible_start_times - expected == set()
