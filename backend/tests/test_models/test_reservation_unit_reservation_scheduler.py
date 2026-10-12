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
        reservation_period_begin_date=_get_date(month=8, day=1),
        reservation_period_end_date=_get_date(month=12, day=31),
        application_period_begins_at=_get_dt(month=4, day=1, hour=9),
        application_period_ends_at=_get_dt(month=4, day=30, hour=16),
    )
    ReservationFactory.create(
        begins_at=_get_dt(month=4, day=15, hour=12),
        ends_at=_get_dt(month=4, day=15, hour=14),
        reservation_unit=reservation_unit,
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
    }

    assert possible_start_times == expected


@pytest.mark.django_db
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times__span_ends_at_midnight():
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES,
        min_reservation_duration=datetime.timedelta(hours=1),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=1, hour=20),
        end_datetime=_get_dt(month=1, day=2, hour=0),
    )

    possible_start_times = reservation_unit.actions.get_possible_start_times(on_date=_get_date(month=1, day=1))

    assert possible_start_times == {
        datetime.time(20, 0),
        datetime.time(21, 0),
        datetime.time(22, 0),
        datetime.time(23, 0),
    }


@pytest.mark.django_db
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times__whole_day():
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES,
        min_reservation_duration=datetime.timedelta(hours=24),
        reservation_block_whole_day=True,
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_dt(month=1, day=1, hour=0),
        end_datetime=_get_dt(month=1, day=2, hour=0),
    )

    possible_start_times = reservation_unit.actions.get_possible_start_times(on_date=_get_date(month=1, day=1))

    assert possible_start_times == {datetime.time(0, 0)}


@pytest.mark.django_db
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times__over_dst_change():
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES,
        min_reservation_duration=datetime.timedelta(hours=3),
    )
    # The clocks move from 03:00 to 04:00 on this night, so the span is 4 real hours long.
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2026, 3, 29, 1, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2026, 3, 29, 6, tzinfo=DEFAULT_TIMEZONE),
    )

    possible_start_times = reservation_unit.actions.get_possible_start_times(on_date=datetime.date(2026, 3, 29))

    assert possible_start_times == {datetime.time(1, 0), datetime.time(2, 0)}


@pytest.mark.django_db
def test__reservation_unit_reservation_scheduler__get_reservation_unit_possible_start_times__skipped_hour():
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES,
        min_reservation_duration=datetime.timedelta(hours=1),
    )
    # The clocks move from 03:00 to 04:00 on this night, so 03:00 does not exist.
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2026, 3, 29, 1, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2026, 3, 29, 6, tzinfo=DEFAULT_TIMEZONE),
    )

    possible_start_times = reservation_unit.actions.get_possible_start_times(on_date=datetime.date(2026, 3, 29))

    assert possible_start_times == {
        datetime.time(1, 0),
        datetime.time(2, 0),
        datetime.time(4, 0),
        datetime.time(5, 0),
    }
