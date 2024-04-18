from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import NamedTuple

import pytest
from django.utils.timezone import get_default_timezone
from graphene_django_extensions.testing.utils import parametrize_helper

from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from reservation_units.utils.first_reservable_time_helper import (
    FirstReservableTimeHelper,
    ReservableTimeSpanFirstReservableTimeHelper,
    ReservationUnitFirstReservableTimeHelper,
)
from tests.factories import OriginHaukiResourceFactory, ReservableTimeSpanFactory, ReservationUnitFactory

DEFAULT_TIMEZONE = get_default_timezone()


# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def _time(*, hour=0, minute=0) -> datetime:
    return datetime(2024, 1, 1, hour, minute, 0, tzinfo=DEFAULT_TIMEZONE)


@dataclass
class ReservationBuffers:
    buffer_time_before: timedelta
    buffer_time_after: timedelta

    def __init__(self, buffer_time_before: int | None, buffer_time_after: int | None):
        self.buffer_time_before = timedelta(minutes=buffer_time_before or 0)
        self.buffer_time_after = timedelta(minutes=buffer_time_after or 0)


class ReservationUnitAndReservationBufferParams(NamedTuple):
    buffer_time_before: timedelta
    buffer_time_after: timedelta
    first_reservable_time: datetime
    reservation_buffers: list[ReservationBuffers] = [ReservationBuffers(None, None), ReservationBuffers(None, None)]


@pytest.mark.parametrize(
    **parametrize_helper(
        # ┌─────────────────────────────────────────────┐
        # │ LEGEND                                      │
        # │ █ = Reservation                             │
        # │ ▄ = Reservation Buffer                      │
        # │ ░ = Not reservable                          │
        # │ ▁ = Reservable                              │
        # │ ═ = First reservable time                   │
        # │ ─ = Reservation Unit Buffer                 │
        # │ One character is 15 minutes in below graphs │
        # └─────────────────────────────────────────────┘
        {
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ══                                   │
            "ReservationUnit -0+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=2, minute=0),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ──══                                 │
            "ReservationUnit -30+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=2, minute=30),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ────────══               │
            "ReservationUnit -120+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=120),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=7, minute=0),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ══──                                 │
            "ReservationUnit -0+30": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(),
                buffer_time_after=timedelta(minutes=30),
                first_reservable_time=_time(hour=2, minute=0),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ══────────               │
            "ReservationUnit -0+120": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(),
                buffer_time_after=timedelta(minutes=120),
                first_reservable_time=_time(hour=5, minute=0),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ──══──                               │
            "ReservationUnit -30+30": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(minutes=30),
                first_reservable_time=_time(hour=2, minute=30),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ────══────               │
            "ReservationUnit -60+60": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=timedelta(minutes=60),
                first_reservable_time=_time(hour=6, minute=0),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ──══──────               │
            "ReservationUnit -30+90": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(minutes=90),
                first_reservable_time=_time(hour=5, minute=30),
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▁▁▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ──══                                 │
            "ReservationUnit -30+0 | Reservation -0+0, -30+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=2, minute=30),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(30, None)],
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▄▄▄▄▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ──══                     │
            "ReservationUnit -30+0 | Reservation -0+0, -90+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=5, minute=30),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(90, None)],
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▁▁▁▁▄▄▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │                     ────══                   │
            "ReservationUnit -60+0 | Reservation -0+0, -60+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=6, minute=0),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(60, None)],
            ),
            # ┌──────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10   │
            # │ ░░░░████▄▄▄▄▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
            # │         ────══                               │
            "ReservationUnit -60+0 | Reservation -0+60, -0+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=timedelta(),
                first_reservable_time=_time(hour=3, minute=0),
                reservation_buffers=[ReservationBuffers(None, 60), ReservationBuffers(0, None)],
            ),
        }
    )
)
def test__find_first_reservable_time_span_for_reservation_unit__different_buffers(
    buffer_time_before,
    buffer_time_after,
    first_reservable_time,
    reservation_buffers,
):
    """
    Test that the first reservable time is found correctly when both ReservationUnit and Reservations have buffers.

    Minimum duration for a reservation is 30 minutes.
    Reservations exist at 01-02 and 04-05.
    Reservable time spans are at 02-04 and 05-09 (Reservation buffers may shorten these).
    """
    origin_hauki_resource = OriginHaukiResourceFactory(
        id="999",
        opening_hours_hash="test_hash",
        latest_fetched_date=date(2024, 12, 31),
    )

    reservation_unit = ReservationUnitFactory(
        origin_hauki_resource=origin_hauki_resource,
        buffer_time_before=buffer_time_before,
        buffer_time_after=buffer_time_after,
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
    )

    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_time(hour=2) + reservation_buffers[0].buffer_time_after,
            end_datetime=_time(hour=4) - reservation_buffers[1].buffer_time_before,
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_time(hour=5) + reservation_buffers[1].buffer_time_after,
            end_datetime=_time(hour=9),
            is_reservable=True,
        ),
    ]

    original_reservable_time_span = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=reservable_time_spans[0].start_datetime,
        end_datetime=reservable_time_spans[1].end_datetime,
    )

    reservation_time_spans = [
        TimeSpanElement(
            start_datetime=_time(hour=1),
            end_datetime=_time(hour=2),
            is_reservable=False,
            buffer_time_before=reservation_buffers[0].buffer_time_before,
            buffer_time_after=reservation_buffers[0].buffer_time_after,
        ),
        TimeSpanElement(
            start_datetime=_time(hour=4),
            end_datetime=_time(hour=5),
            is_reservable=False,
            buffer_time_before=reservation_buffers[1].buffer_time_before,
            buffer_time_after=reservation_buffers[1].buffer_time_after,
        ),
    ]

    helper = FirstReservableTimeHelper(ReservationUnit.objects.none(), minimum_duration_minutes=30)
    reservation_unit_helper = ReservationUnitFirstReservableTimeHelper(helper, reservation_unit)
    reservable_time_span_helper = ReservableTimeSpanFirstReservableTimeHelper(
        reservation_unit_helper,
        original_reservable_time_span,
    )
    result = reservable_time_span_helper._find_first_reservable_time_span(
        normalised_reservable_time_spans=reservable_time_spans,
        reservation_time_spans=reservation_time_spans,
    )

    assert result == first_reservable_time


def test__find_first_reservable_time_span_for_reservation_unit__buffer_goes_through_closed_time_to_reservation():
    """
    Test that the first reservable time is found correctly when ReservationUnit buffer goes through closed time to
    a reservation.
    """
    # ┌──────────────────────────────────────────────┐
    # │ 0   1   2   3   4   5   6   7   8   9   10   │
    # │ ░░░░░░░░▁▁▁▁░░░░████░░░░▁▁▁▁░░░░▁▁▁▁░░░░░░░░ │
    # │                         ────────══────────   │

    origin_hauki_resource = OriginHaukiResourceFactory(
        id="999",
        opening_hours_hash="test_hash",
        latest_fetched_date=date(2024, 12, 31),
    )
    reservation_unit = ReservationUnitFactory(
        origin_hauki_resource=origin_hauki_resource,
        buffer_time_before=timedelta(minutes=120),
        buffer_time_after=timedelta(minutes=120),
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
    )

    original_reservable_time_span = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=_time(hour=2),
        end_datetime=_time(hour=9),
    )

    reservable_time_spans = [
        TimeSpanElement(start_datetime=_time(hour=2), end_datetime=_time(hour=3), is_reservable=True),
        TimeSpanElement(start_datetime=_time(hour=6), end_datetime=_time(hour=7), is_reservable=True),
        TimeSpanElement(start_datetime=_time(hour=8), end_datetime=_time(hour=9), is_reservable=True),
    ]

    reservation_time_spans = [
        TimeSpanElement(
            start_datetime=_time(hour=4),
            end_datetime=_time(hour=5),
            is_reservable=False,
        ),
    ]

    helper = FirstReservableTimeHelper(ReservationUnit.objects.none(), minimum_duration_minutes=30)
    reservation_unit_helper = ReservationUnitFirstReservableTimeHelper(helper, reservation_unit)
    reservable_time_span_helper = ReservableTimeSpanFirstReservableTimeHelper(
        reservation_unit_helper,
        original_reservable_time_span,
    )
    result = reservable_time_span_helper._find_first_reservable_time_span(
        normalised_reservable_time_spans=reservable_time_spans,
        reservation_time_spans=reservation_time_spans,
    )

    assert result == _time(hour=8)


def test__find_first_reservable_time_span_for_reservation_unit__interval_is_longer_than_min_duration():
    """Test that the first reservable time is found correctly when the interval is longer than the minimum duration."""
    # ┌──────────────────────────────────────────────┐
    # │ 0   1   2   3   4   5   6   7   8   9   10   │
    # │ ░░░░░░░░░░░░▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    # │                     ════════                 │

    origin_hauki_resource = OriginHaukiResourceFactory(id="999", latest_fetched_date=date(2024, 12, 31))
    reservation_unit = ReservationUnitFactory(
        origin_hauki_resource=origin_hauki_resource,
        min_reservation_duration=timedelta(minutes=15),
        reservation_start_interval=ReservationStartInterval.INTERVAL_120_MINUTES.value,
    )

    reservable_time_spans = [
        TimeSpanElement(start_datetime=_time(hour=3), end_datetime=_time(hour=4), is_reservable=True),
        TimeSpanElement(start_datetime=_time(hour=5), end_datetime=_time(hour=9), is_reservable=True),
    ]
    original_reservable_time_span = ReservableTimeSpanFactory(
        resource=origin_hauki_resource,
        start_datetime=reservable_time_spans[0].start_datetime,
        end_datetime=reservable_time_spans[1].end_datetime,
    )

    reservation_time_spans = [
        TimeSpanElement(start_datetime=_time(hour=4), end_datetime=_time(hour=5), is_reservable=False),
    ]

    helper = FirstReservableTimeHelper(ReservationUnit.objects.none())
    reservation_unit_helper = ReservationUnitFirstReservableTimeHelper(helper, reservation_unit)
    reservable_time_span_helper = ReservableTimeSpanFirstReservableTimeHelper(
        reservation_unit_helper,
        original_reservable_time_span,
    )
    result = reservable_time_span_helper._find_first_reservable_time_span(
        normalised_reservable_time_spans=reservable_time_spans,
        reservation_time_spans=reservation_time_spans,
    )

    assert reservation_unit_helper.minimum_duration_minutes == 120
    assert result == _time(hour=5)


def test__find_first_reservable_time_span_for_reservation_unit__max_duration_is_not_multiple_of_interval():
    """
    If the maximum duration is not a multiple of the interval, it is rounded down to the last multiple of the interval.
    e.g.
    Interval: 3 hours
    Max duration: 14 hours
    Rounded down max duration: 12 hours
    """
    reservation_unit = ReservationUnitFactory(
        min_reservation_duration=timedelta(minutes=140),
        max_reservation_duration=timedelta(minutes=200),
        reservation_start_interval=ReservationStartInterval.INTERVAL_120_MINUTES.value,
    )

    helper = FirstReservableTimeHelper(ReservationUnit.objects.none())
    reservation_unit_helper = ReservationUnitFirstReservableTimeHelper(helper, reservation_unit)

    # Minimum duration is longer than interval, so it is kept as-is
    assert reservation_unit_helper.minimum_duration_minutes == 140
    # Maximum is not a multiple of interval, so it is rounded down to the last multiple of the interval, which is 120
    # causing the maximum duration to be less than the minimum duration
    assert reservation_unit_helper.is_reservation_unit_max_duration_invalid is True
