from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from common.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day
from opening_hours.utils.reservable_time_span_client import merge_overlapping_time_span_elements
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.enums import ReservationStartInterval
from reservation_units.utils.first_reservable_time_helper.first_reservable_time_reservable_time_span_helper import (
    ReservableTimeSpanFirstReservableTimeHelper,
)
from reservation_units.utils.first_reservable_time_helper.utils import ReservableTimeOutput

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit
    from reservation_units.utils.first_reservable_time_helper.first_reservable_time_helper import (
        FirstReservableTimeHelper,
    )


class ReservationUnitFirstReservableTimeHelper:
    """
    Helper class for finding the first reservable time for a ReservationUnit.

    This helper is meant to be used only together with the `FirstReservableTimeHelper` class.
    """

    parent: FirstReservableTimeHelper
    reservation_unit: ReservationUnit

    # Hard Closed Time Spans
    # [x] Affects closed status
    # [x] Can overlap with buffers
    hard_closed_time_spans: list[TimeSpanElement]

    # Soft Closed Time Spans
    # [ ] Affects closed status
    # [x] Can overlap with buffers
    soft_closed_time_spans: list[TimeSpanElement]

    # BLOCKED-type Reservation Closed Time Spans
    # [ ] Affects closed status
    # [X] Can overlap with buffers
    blocking_reservation_closed_time_spans: list[TimeSpanElement]

    # Reservation Closed Time Spans
    # [ ] Affects closed status
    # [ ] Can overlap with buffers
    reservation_closed_time_spans: list[TimeSpanElement]

    # Minimum duration in minutes for the ReservationUnit
    minimum_duration_minutes: int

    is_reservation_unit_max_duration_invalid: bool

    def __init__(self, parent: FirstReservableTimeHelper, reservation_unit: ReservationUnit) -> None:
        self.parent = parent
        self.reservation_unit = reservation_unit

        self.hard_closed_time_spans = self._get_hard_closed_time_spans()
        self.hard_closed_time_spans += parent.shared_hard_closed_time_spans
        self.hard_closed_time_spans = self._merge_time_spans(self.hard_closed_time_spans)

        self.reservation_closed_time_spans = self._get_reservation_closed_time_spans()
        self.reservation_closed_time_spans = self._merge_time_spans(self.reservation_closed_time_spans)
        self.blocking_reservation_closed_time_spans = self._get_blocking_reservation_closed_time_spans()

        self.soft_closed_time_spans = self._get_soft_closed_time_spans()
        self.soft_closed_time_spans += self.reservation_closed_time_spans
        self.soft_closed_time_spans += self.blocking_reservation_closed_time_spans
        self.soft_closed_time_spans = self._merge_time_spans(self.soft_closed_time_spans)

        start_interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        self.minimum_duration_minutes = max(
            parent.filter_minimum_duration_minutes,
            int((reservation_unit.min_reservation_duration or timedelta()).total_seconds() / 60),
            start_interval_minutes,  # Minimum duration must be at least as long as the start interval
        )

        if reservation_unit.max_reservation_duration is None:
            self.is_reservation_unit_max_duration_invalid = False
        else:
            maximum_duration_minutes = reservation_unit.max_reservation_duration.total_seconds() / 60
            # Ensure that the maximum duration is a multiple of the start interval
            if maximum_duration_minutes % start_interval_minutes != 0:
                maximum_duration_minutes -= maximum_duration_minutes % start_interval_minutes
            # Check if the ReservationUnits Maximum Reservation Duration is at least as long as the minimum duration.
            # Note that we still need to check if the ReservationUnit is considered Open, so we can't return early here.
            self.is_reservation_unit_max_duration_invalid = maximum_duration_minutes < self.minimum_duration_minutes

    @staticmethod
    def _merge_time_spans(time_spans) -> list[TimeSpanElement]:
        return merge_overlapping_time_span_elements(sorted(time_spans, key=lambda time_span: time_span.start_datetime))

    def calculate_first_reservable_time(self) -> ReservableTimeOutput:
        is_closed = True

        # Go through each ReservableTimeSpan individually one-by-one until a suitable time span is found.
        for reservable_time_span in self.reservation_unit.origin_hauki_resource.reservable_time_spans.all():
            helper = ReservableTimeSpanFirstReservableTimeHelper(parent=self, reservable_time_span=reservable_time_span)
            output = helper.calculate_first_reservable_time()

            # The ReservationUnit is not closed. Save the value in case we don't find a first reservable time.
            if output.is_closed is False:
                is_closed = False

            # If we have found a first reservable time, we can return early
            if output.first_reservable_time is not None:
                return output

        return ReservableTimeOutput(is_closed=is_closed, first_reservable_time=None)

    def _get_hard_closed_time_spans(self) -> list[TimeSpanElement]:
        """
        Get a list of closed time spans that cause the ReservationUnit to be shown as closed

        Returned list of closed TimeSpanElements is built using:
        - reservation_unit.reservation_begins
        - reservation_unit.reservation_ends
        - reservation_unit.publish_ends
        - reservation_unit.application_rounds.reservation_period_begin
        - reservation_unit.application_rounds.reservation_period_end
        """
        reservation_unit_closed_time_spans: list[TimeSpanElement] = []

        if self.reservation_unit.reservation_begins:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=local_datetime_min(),
                    end_datetime=self.reservation_unit.reservation_begins,
                    is_reservable=False,
                )
            )
        if self.reservation_unit.reservation_ends:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=self.reservation_unit.reservation_ends,
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        if self.reservation_unit.publish_ends:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=self.reservation_unit.publish_ends,
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        # The `RESULTS_SENT` status ApplicationRounds already excluded when `application_rounds` are prefetched,
        # so we don't need to filter those away here.
        reservation_unit_closed_time_spans.extend(
            TimeSpanElement(
                start_datetime=local_start_of_day(application_round.reservation_period_begin),
                end_datetime=local_start_of_day(application_round.reservation_period_end) + timedelta(days=1),
                is_reservable=False,
            )
            for application_round in self.reservation_unit.application_rounds.all()
        )

        return reservation_unit_closed_time_spans

    def _get_soft_closed_time_spans(self) -> list[TimeSpanElement]:
        """
        Get a list of closed time spans that have no effect on the closed status of the ReservationUnit

        Returned list of closed TimeSpanElements is built using:
        - reservation_unit.reservations_min_days_before
        - reservation_unit.reservations_max_days_before
        """
        now = local_datetime()
        reservation_unit_closed_time_spans: list[TimeSpanElement] = []

        if self.reservation_unit.reservations_min_days_before:
            # Minimum days before is calculated from the start of the day
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=local_datetime_min(),
                    end_datetime=(
                        local_start_of_day(now) + timedelta(days=self.reservation_unit.reservations_min_days_before)
                    ),
                    is_reservable=False,
                )
            )
        if self.reservation_unit.reservations_max_days_before:
            reservation_unit_closed_time_spans.append(
                TimeSpanElement(
                    start_datetime=now + timedelta(days=self.reservation_unit.reservations_max_days_before),
                    end_datetime=local_datetime_max(),
                    is_reservable=False,
                )
            )

        return reservation_unit_closed_time_spans

    def _get_reservation_closed_time_spans(self) -> list[TimeSpanElement]:
        """Get a list of closed time spans from Reservations of the ReservationUnit"""
        return list(self.parent.reservation_closed_time_spans_map.get(self.reservation_unit.pk, set()))

    def _get_blocking_reservation_closed_time_spans(self) -> list[TimeSpanElement]:
        """Get a list of closed time spans from Reservations of the ReservationUnit"""
        return list(self.parent.blocking_reservation_closed_time_spans_map.get(self.reservation_unit.pk, set()))
