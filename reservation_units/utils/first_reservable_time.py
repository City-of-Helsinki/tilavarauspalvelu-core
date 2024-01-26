from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING

from common.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day
from opening_hours.utils.time_span_element import TimeSpanElement

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit

__all__ = [
    "get_shared_hard_closed_time_spans",
    "get_hard_closed_time_spans_for_reservation_unit",
    "get_soft_closed_time_spans_for_reservation_unit",
    "find_first_reservable_time_span_for_reservation_unit",
]


def get_shared_hard_closed_time_spans(filter_date_start: date, filter_date_end: date) -> list[TimeSpanElement]:
    now = local_datetime()

    return [
        TimeSpanElement(
            start_datetime=local_datetime_min(),
            end_datetime=max(local_start_of_day(filter_date_start), now),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=local_start_of_day(filter_date_end) + timedelta(days=1),
            end_datetime=local_datetime_max(),
            is_reservable=False,
        ),
    ]


def get_hard_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    """Get a list of closed time spans that cause the ReservationUnit to be shown as closed"""
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservation_begins:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=reservation_unit.reservation_begins,
                is_reservable=False,
            )
        )
    if reservation_unit.reservation_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.reservation_ends,
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    if reservation_unit.publish_ends:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=reservation_unit.publish_ends,
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    # The `RESULTS_SENT` status ApplicationRounds already excluded in the queryset Prefetch
    for application_round in reservation_unit.application_rounds.all():
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=local_start_of_day(application_round.reservation_period_begin),
                end_datetime=local_start_of_day(application_round.reservation_period_end) + timedelta(days=1),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


def get_soft_closed_time_spans_for_reservation_unit(reservation_unit: "ReservationUnit") -> list[TimeSpanElement]:
    """Get a list of closed time spans that have no effect on the closed status of the ReservationUnit"""
    now = local_datetime()
    reservation_unit_closed_time_spans: list[TimeSpanElement] = []

    if reservation_unit.reservations_min_days_before:
        # Minimum days before is calculated from the start of the day
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=local_datetime_min(),
                end_datetime=(local_start_of_day(now) + timedelta(days=reservation_unit.reservations_min_days_before)),
                is_reservable=False,
            )
        )
    if reservation_unit.reservations_max_days_before:
        reservation_unit_closed_time_spans.append(
            TimeSpanElement(
                start_datetime=now + timedelta(days=reservation_unit.reservations_max_days_before),
                end_datetime=local_datetime_max(),
                is_reservable=False,
            )
        )

    return reservation_unit_closed_time_spans


def find_first_reservable_time_span_for_reservation_unit(
    reservation_unit: "ReservationUnit",
    normalised_reservable_time_spans: list[TimeSpanElement],
    reservations: list[TimeSpanElement],
    minimum_duration_minutes: int,
) -> datetime | None:
    """
    Find the first reservable time span for the ReservationUnit.

    In this function we know that normalised_reservable_time_spans (without buffers) and reservations (with buffers)
    never overlap due to earlier normalisation.
    However, normalised_reservable_time_spans (with buffers from reservation_unit) and
    reservations (without buffers) can overlap, so we need to process the normalised_reservable_time_spans one-by-one
    and check if they overlap with reservations.
    If they do, we need to shorten the reservable_time_span so that its buffer doesn't overlap with the reservation,
    while leaving the buffer size unchanged.
    After processing, we can check if the reservable_time_span is still long enough to fit the minimum duration.
    """
    for reservable_time_span in normalised_reservable_time_spans:
        if reservable_time_span is None:
            continue

        reservable_time_span.buffer_time_before = reservation_unit.buffer_time_before
        reservable_time_span.buffer_time_after = reservation_unit.buffer_time_after

        for reservation in reservations:
            # Reservation (with buffers) can not overlap with the reservable time span (without buffers).
            if reservable_time_span.overlaps_with(reservation):
                raise ValueError("Reservable Time Span overlaps with Reservations buffer, this should never happen.")

            # Only continue forward if a buffered time span overlaps with a reservation (without buffers)
            if not reservation.overlaps_with(reservable_time_span):
                # No overlapping, skip
                continue

            # Reservation is inside the Before-buffer, shorten the reservable time span from the start
            # ┌──────────────────────────┬─────────────────────────────────────┐
            # │ ----oooooo ->     ----oo │ Reservation starts in Before-buffer │
            # │ xxxx       -> xxxx       │                                     │
            # ├──────────────────────────┼─────────────────────────────────────┤
            # │     --oooo ->       --oo │ Reservation ends in Before-buffer   │
            # │   xxxx     ->   xxxx     │                                     │
            # └──────────────────────────┴─────────────────────────────────────┘
            elif (
                reservable_time_span.buffered_start_datetime
                <= reservation.end_datetime
                <= reservable_time_span.start_datetime
            ):
                overlap = reservation.end_datetime - reservable_time_span.buffered_start_datetime
                reservable_time_span.start_datetime += overlap

            # Reservation is inside the After-buffer, shorten the reservable time span from the end
            # ┌──────────────────────────┬─────────────────────────────────────┐
            # │ oooo----   -> oo----     │ Reservation starts in After-buffer  │
            # │       xxxx ->       xxxx │                                     │
            # ├──────────────────────────┼─────────────────────────────────────┤
            # │ oooooo---- -> oo----     │ Reservation ends in After-buffer    │
            # │       xxxx ->       xxxx │                                     │
            # └──────────────────────────┴─────────────────────────────────────┘
            elif (
                reservable_time_span.end_datetime
                <= reservation.start_datetime
                <= reservable_time_span.buffered_end_datetime
            ):
                overlap = reservable_time_span.buffered_end_datetime - reservation.start_datetime
                reservable_time_span.end_datetime -= overlap

            if reservable_time_span.duration_minutes <= 0:
                break

        # In case of an invalid start time due to normalisation, move to the next valid start time
        reservable_time_span.move_to_next_valid_start_time(reservation_unit)

        if reservable_time_span.can_fit_reservation_for_reservation_unit(
            reservation_unit=reservation_unit,
            minimum_duration_minutes=minimum_duration_minutes,
        ):
            return reservable_time_span.start_datetime

    return None
