from __future__ import annotations

import datetime
import math
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import ReservationStartInterval
from tilavarauspalvelu.integrations.opening_hours.time_span_element_utils import (
    override_reservable_with_closed_time_spans,
)
from tilavarauspalvelu.services.first_reservable_time.utils import ReservableTimeOutput

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
    from tilavarauspalvelu.models import ReservableTimeSpan
    from tilavarauspalvelu.services.first_reservable_time.first_reservable_time_reservation_unit_helper import (
        ReservationUnitFirstReservableTimeHelper,
    )


class ReservableTimeSpanFirstReservableTimeHelper:
    """
    Helper class for finding the first reservable time for a ReservationUnit in a single ReservableTimeSpan.

    This helper is meant to be used only together with the `ReservationUnitFirstReservableTimeHelper` class.
    """

    parent: ReservationUnitFirstReservableTimeHelper
    reservable_time_span: ReservableTimeSpan

    def __init__(
        self,
        parent: ReservationUnitFirstReservableTimeHelper,
        reservable_time_span: ReservableTimeSpan,
    ) -> None:
        self.parent = parent
        self.reservable_time_span = reservable_time_span

    def calculate_first_reservable_time(self) -> ReservableTimeOutput:
        current_time_span = self.reservable_time_span.as_time_span_element()

        # Remove hard closed time spans from given reservable time span.
        # This might split it into multiple time spans, thus the list.
        normalised_time_spans: list[TimeSpanElement] = self._hard_normalise_time_span(current_time_span)

        # If there are no reservable time spans left, the ReservationUnit is closed during this time span.
        if not normalised_time_spans:
            return ReservableTimeOutput(is_closed=True, first_reservable_time=None)

        # If we know the reservation unit is open, we can exit early if reservation unit
        # max duration is shorter than given minimum duration (we will never find a slot).
        if not self.parent.is_reservation_unit_closed and self.parent.is_reservation_unit_max_duration_too_short:
            return ReservableTimeOutput(is_closed=False, first_reservable_time=None)

        # Next, remove all soft-closed time spans from the reservable time span.
        normalised_time_spans = self._soft_normalise_time_span(normalised_time_spans)
        if not normalised_time_spans:
            return ReservableTimeOutput(is_closed=False, first_reservable_time=None)

        # At this point we have removed all the closed time spans from the reservable time span.
        # Finally, try to find the first reservable time span from the left over reservable time spans.
        first_reservable_time: datetime | None = self._find_first_reservable_time_span(
            normalised_reservable_time_spans=normalised_time_spans,
            reservation_time_spans=self.parent.reservation_closed_time_spans,
        )

        return ReservableTimeOutput(is_closed=False, first_reservable_time=first_reservable_time)

    def _hard_normalise_time_span(self, current_time_span: TimeSpanElement) -> list[TimeSpanElement]:
        """Remove Hard-Closed time spans from a TimeSpanElement."""
        combined_hard_closed_time_spans: list[TimeSpanElement] = (
            self.parent.hard_closed_time_spans
            + current_time_span.generate_closed_time_spans_outside_filter(
                filter_time_start=self.parent.parent.filter_time_start,
                filter_time_end=self.parent.parent.filter_time_end,
            )
        )

        return override_reservable_with_closed_time_spans(
            reservable_time_spans=[current_time_span],
            closed_time_spans=combined_hard_closed_time_spans,
        )

    def _soft_normalise_time_span(self, hard_normalised_time_spans: list[TimeSpanElement]) -> list[TimeSpanElement]:
        """Remove Soft-Closed time spans from the reservable time span."""
        return override_reservable_with_closed_time_spans(
            reservable_time_spans=hard_normalised_time_spans,
            closed_time_spans=self.parent.soft_closed_time_spans,
        )

    def _find_first_reservable_time_span(
        self,
        normalised_reservable_time_spans: list[TimeSpanElement],
        reservation_time_spans: list[TimeSpanElement],
    ) -> datetime | None:
        """
        Find the first reservable time span for the ReservationUnit.

        Due to earlier normalisation, we know that `normalised_reservable_time_spans` (without buffers) and
        `reservation_time_spans` (with buffers) can never overlap.

        However, because the `normalised_reservable_time_spans` (with buffers from reservation_unit) and
        `reservation_time_spans` (without buffers) can overlap, so we need to process
        the `normalised_reservable_time_spans` one-by-one and check if they overlap with `reservation_time_spans`.

        If they do overlap, we need to shorten the `reservable_time_span` so that its buffer doesn't overlap with
        the `reservation`, while leaving the buffer size unchanged.

        After processing, we can check if the reservable_time_span is still long enough to fit the minimum duration.
        """
        reservation_unit = self.parent.reservation_unit
        minimum_duration_minutes = self.parent.minimum_duration_minutes

        for reservable_time_span in normalised_reservable_time_spans:
            if reservable_time_span is None:
                continue

            # The reservable time span inherits the buffer times from the ReservationUnit
            reservable_time_span.buffer_time_before = reservation_unit.buffer_time_before
            reservable_time_span.buffer_time_after = reservation_unit.buffer_time_after

            for reservation in reservation_time_spans:
                # Reservation (with buffers) can not overlap with the reservable time span (without buffers).
                if reservable_time_span.overlaps_with(reservation):
                    msg = "Reservable Time Span overlaps with Reservation buffer. This should never happen."
                    raise ValueError(msg)

                # Only continue forward if a buffered time span overlaps with a reservation (without buffers)
                if not reservation.overlaps_with(reservable_time_span):
                    continue  # No overlapping, skip

                # Reservation is inside the Before-buffer, shorten the reservable time span from the start
                # ┌────────────────────────────────────────────────────────────────┐
                # │ █ = Existing Reservation                                       │
                # │ ▁ = Reservable Time Span                                       │
                # │ ▄ = Reservable Time Span Buffer                                │
                # ├──────────────────────────┬─────────────────────────────────────┤
                # │ ▄▄▄▄▁▁▁▁▁▁ ->     ▄▄▄▄▁▁ │ Reservation starts in Before-buffer │
                # │ ████       -> ████       │                                     │
                # ├──────────────────────────┼─────────────────────────────────────┤
                # │     ▄▄▁▁▁▁ ->       ▄▄▁▁ │ Reservation ends in Before-buffer   │
                # │   ████     ->   ████     │                                     │
                # └──────────────────────────┴─────────────────────────────────────┘
                if (
                    reservable_time_span.buffered_start_datetime
                    <= reservation.end_datetime
                    <= reservable_time_span.start_datetime
                ):
                    overlap = reservation.end_datetime - reservable_time_span.buffered_start_datetime
                    reservable_time_span.start_datetime += overlap

                # Reservation is inside the After-buffer, shorten the reservable time span from the end
                # ┌──────────────────────────┬─────────────────────────────────────┐
                # │ ▁▁▁▁▄▄▄▄   -> ▁▁▄▄▄▄     │ Reservation starts in After-buffer  │
                # │       ████ ->       ████ │                                     │
                # ├──────────────────────────┼─────────────────────────────────────┤
                # │ ▁▁▁▁▁▁▄▄▄▄ -> ▁▁▄▄▄▄     │ Reservation ends in After-buffer    │
                # │       ████ ->       ████ │                                     │
                # └──────────────────────────┴─────────────────────────────────────┘
                elif (
                    reservable_time_span.end_datetime
                    <= reservation.start_datetime
                    <= reservable_time_span.buffered_end_datetime
                ):
                    overlap = reservable_time_span.buffered_end_datetime - reservation.start_datetime
                    reservable_time_span.end_datetime -= overlap

                # Reservable Time Span is now shorter than the minimum duration, so we can't use it.
                if reservable_time_span.duration_minutes < minimum_duration_minutes:
                    break

            # In case of an invalid start time due to normalisation, move to the next valid start time
            self._move_time_span_to_next_valid_start_time(reservable_time_span)

            if self._can_reservation_fit_inside_time_span(reservable_time_span):
                return reservable_time_span.start_datetime

        return None

    def _move_time_span_to_next_valid_start_time(self, time_span: TimeSpanElement) -> None:
        """
        Move the given reservable time spans start time to the next valid start time based on the
        given reservation unit's settings and filter time start.

        ---

        For the start time to be valid, it must be at an interval that is valid for the ReservationUnit starting
        from the beginning of the ReservableTimeSpan.

        Examples:
        1.
          - ReservationUnit.reservation_start_interval is 30 minutes.
          - ReservableTimeSpan.start_datetime is 10:00.
          - A new reservation must start at 10:00, 10:30, 11:00, 11:30 etc.
        2.
          - ReservationUnit.reservation_start_interval is 90 minutes.
          - ReservableTimeSpan.start_datetime is 11:15.
          - A new reservation must start at 11:15, 12:45, 14:15, 15:45 etc.
        """
        reservation_unit = self.parent.reservation_unit
        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        time_span.round_start_time_to_next_minute()

        difference: datetime.timedelta = time_span.start_datetime - self.reservable_time_span.start_datetime
        difference_minutes = difference.total_seconds() / 60

        minutes_past_interval = math.ceil(difference_minutes % interval_minutes)
        if minutes_past_interval == 0:
            return

        # Move the start time to the next valid interval by adding the difference between
        # interval_minutes and minutes_past_interval to the start time.
        # e.g. interval=30, overflow_minutes=15, start_time += (30-15 = 15) minutes
        minutes_to_next_interval = datetime.timedelta(minutes=interval_minutes - minutes_past_interval)
        time_span.start_datetime += minutes_to_next_interval

    def _can_reservation_fit_inside_time_span(self, time_span: TimeSpanElement) -> bool:
        """
        Can the given TimeSpanElement fit a reservation for the ReservationUnit?

        We need to validate front, back and total duration separately because the buffers can be of different lengths.
        """
        reservation_unit = self.parent.reservation_unit
        minimum_duration_minutes = self.parent.minimum_duration_minutes

        # If this time span's duration is less than the minimum duration, it obviously can't fit.
        if time_span.duration_minutes < minimum_duration_minutes:
            return False

        # Validate duration with front buffers
        buffer_front_minutes = 0
        if reservation_unit.buffer_time_before:
            buffer_front_minutes = reservation_unit.buffer_time_before.total_seconds() / 60
            if time_span.front_buffered_duration_minutes < (buffer_front_minutes + minimum_duration_minutes):
                return False

        # Validate duration with back buffers
        buffer_back_minutes = 0
        if reservation_unit.buffer_time_after:
            buffer_back_minutes = reservation_unit.buffer_time_after.total_seconds() / 60
            if time_span.back_buffered_duration_minutes < (minimum_duration_minutes + buffer_back_minutes):
                return False

        # Validate duration with front and back buffers together
        buffered_minimum_duration_minutes = minimum_duration_minutes + buffer_front_minutes + buffer_back_minutes
        return buffered_minimum_duration_minutes <= time_span.buffered_duration_minutes
