from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import NamedTuple

import pytest
from django.utils.timezone import get_default_timezone

from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.enums import ReservationStartInterval
from reservation_units.querysets import _find_first_reservable_time_span_for_reservation_unit
from tests.factories import (
    ReservationUnitFactory,
)
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

DEFAULT_TIMEZONE = get_default_timezone()


def _time(*, hour=0, minute=0) -> datetime:
    return datetime(2024, 1, 1, hour, minute, 0, tzinfo=DEFAULT_TIMEZONE)


@dataclass
class ReservationBuffers:
    buffer_time_before: timedelta
    buffer_time_after: timedelta

    def __init__(self, buffer_time_before: int | None, buffer_time_after: int | None):
        self.buffer_time_before = timedelta(minutes=buffer_time_before if buffer_time_before else 0)
        self.buffer_time_after = timedelta(minutes=buffer_time_after if buffer_time_after else 0)


class ReservationUnitAndReservationBufferParams(NamedTuple):
    buffer_time_before: timedelta | None
    buffer_time_after: timedelta | None
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
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ══                                  │
            "ReservationUnit -0+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=None,
                buffer_time_after=None,
                first_reservable_time=_time(hour=2, minute=0),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ──══                                │
            "ReservationUnit -30+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=None,
                first_reservable_time=_time(hour=2, minute=30),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ────────══              │
            "ReservationUnit -120+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=120),
                buffer_time_after=None,
                first_reservable_time=_time(hour=7, minute=0),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ══──                                │
            "ReservationUnit -0+30": ReservationUnitAndReservationBufferParams(
                buffer_time_before=None,
                buffer_time_after=timedelta(minutes=30),
                first_reservable_time=_time(hour=2, minute=0),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ══────────              │
            "ReservationUnit -0+120": ReservationUnitAndReservationBufferParams(
                buffer_time_before=None,
                buffer_time_after=timedelta(minutes=120),
                first_reservable_time=_time(hour=5, minute=0),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ──══──                              │
            "ReservationUnit -30+30": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(minutes=30),
                first_reservable_time=_time(hour=2, minute=30),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ────══────              │
            "ReservationUnit -60+60": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=timedelta(minutes=60),
                first_reservable_time=_time(hour=6, minute=0),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ──══──────              │
            "ReservationUnit -30+90": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=timedelta(minutes=90),
                first_reservable_time=_time(hour=5, minute=30),
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▁▁▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ──══                                │
            "ReservationUnit -30+0 | Reservation -0+0, -30+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=None,
                first_reservable_time=_time(hour=2, minute=30),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(30, None)],
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▄▄▄▄▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ──══                    │
            "ReservationUnit -30+0 | Reservation -0+0, -90+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=30),
                buffer_time_after=None,
                first_reservable_time=_time(hour=5, minute=30),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(90, None)],
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▁▁▁▁▄▄▄▄████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │                     ────══                  │
            "ReservationUnit -60+0 | Reservation -0+0, -60+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=None,
                first_reservable_time=_time(hour=6, minute=0),
                reservation_buffers=[ReservationBuffers(None, None), ReservationBuffers(60, None)],
            ),
            # ┌─────────────────────────────────────────────┐
            # │ 0   1   2   3   4   5   6   7   8   9   10  │
            # │ ░░░░████▄▄▄▄▁▁▁▁████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
            # │         ────══                              │
            "ReservationUnit -60+0 | Reservation -0+60, -0+0": ReservationUnitAndReservationBufferParams(
                buffer_time_before=timedelta(minutes=60),
                buffer_time_after=None,
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
    reservation_unit = ReservationUnitFactory(
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

    reservations = [
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

    result = _find_first_reservable_time_span_for_reservation_unit(
        reservation_unit=reservation_unit,
        normalised_reservable_time_spans=reservable_time_spans,
        reservations=reservations,
        minimum_duration_minutes=30,
    )

    assert result == first_reservable_time


def test__find_first_reservable_time_span_for_reservation_unit__buffer_goes_through_closed_time_to_reservation():
    """
    Test that the first reservable time is found correctly when ReservationUnit buffer goes through closed time to
    a reservation.
    """
    # ┌─────────────────────────────────────────────┐
    # │ 0   1   2   3   4   5   6   7   8   9   10  │
    # │ ░░░░░░░░▁▁▁▁░░░░████░░░░▁▁▁▁░░░░▁▁▁▁░░░░░░░ │
    # │                         ────────══────────  │
    reservation_unit = ReservationUnitFactory(
        buffer_time_before=timedelta(minutes=120),
        buffer_time_after=timedelta(minutes=120),
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
    )

    reservable_time_spans = [
        TimeSpanElement(
            start_datetime=_time(hour=2),
            end_datetime=_time(hour=3),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_time(hour=6),
            end_datetime=_time(hour=7),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_time(hour=8),
            end_datetime=_time(hour=9),
            is_reservable=True,
        ),
    ]

    reservations = [
        TimeSpanElement(
            start_datetime=_time(hour=4),
            end_datetime=_time(hour=5),
            is_reservable=False,
        ),
    ]

    result = _find_first_reservable_time_span_for_reservation_unit(
        reservation_unit=reservation_unit,
        normalised_reservable_time_spans=reservable_time_spans,
        reservations=reservations,
        minimum_duration_minutes=30,
    )

    assert result == _time(hour=8)
