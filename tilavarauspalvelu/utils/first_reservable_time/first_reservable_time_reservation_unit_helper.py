from __future__ import annotations

from datetime import timedelta
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import ReservationStartInterval
from tilavarauspalvelu.utils.first_reservable_time.first_reservable_time_reservable_time_span_helper import (
    ReservableTimeSpanFirstReservableTimeHelper,
)
from tilavarauspalvelu.utils.first_reservable_time.utils import ReservableTimeOutput
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from tilavarauspalvelu.utils.opening_hours.time_span_element_utils import merge_overlapping_time_span_elements
from utils.date_utils import local_datetime, local_datetime_max, local_datetime_min, local_start_of_day

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.utils.first_reservable_time.first_reservable_time_helper import FirstReservableTimeHelper


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

    is_reservation_unit_max_duration_too_short: bool

    is_reservation_unit_closed: bool

    def __init__(self, parent: FirstReservableTimeHelper, reservation_unit: ReservationUnit) -> None:
        self.parent = parent
        self.reservation_unit = reservation_unit

        self.hard_closed_time_spans = merge_overlapping_time_span_elements(
            self._get_hard_closed_time_spans(),
            parent.shared_hard_closed_time_spans,
        )

        pk = reservation_unit.pk
        self.reservation_closed_time_spans = parent.reservation_closed_time_spans_map.get(pk, [])
        self.blocking_reservation_closed_time_spans = parent.blocking_reservation_closed_time_spans_map.get(pk, [])

        self.soft_closed_time_spans = merge_overlapping_time_span_elements(
            self._get_soft_closed_time_spans(),
            self.reservation_closed_time_spans,
            self.blocking_reservation_closed_time_spans,
        )

        start_interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        self.minimum_duration_minutes = max(
            parent.filter_minimum_duration_minutes,
            int((reservation_unit.min_reservation_duration or timedelta()).total_seconds() / 60),
            start_interval_minutes,  # Minimum duration must be at least as long as the start interval
        )

        self.is_reservation_unit_max_duration_too_short = False
        if reservation_unit.max_reservation_duration is not None:
            maximum_duration_minutes = reservation_unit.max_reservation_duration.total_seconds() / 60
            # Ensure that the maximum duration is a multiple of the start interval
            if maximum_duration_minutes % start_interval_minutes != 0:
                maximum_duration_minutes -= maximum_duration_minutes % start_interval_minutes

            # Check if the ReservationUnit's maximum Reservation duration is at least
            # as long as the minimum duration. Note that we still need to check if the
            # ReservationUnit is considered Open, so we can't return early here.
            self.is_reservation_unit_max_duration_too_short = maximum_duration_minutes < self.minimum_duration_minutes

    def calculate_first_reservable_time(self) -> ReservableTimeOutput:
        self.is_reservation_unit_closed = True

        # ReservationUnits are not reservable without a HaukiResource
        if self.reservation_unit.origin_hauki_resource is None:
            return ReservableTimeOutput(is_closed=self.is_reservation_unit_closed, first_reservable_time=None)

        # Go through each ReservableTimeSpan individually one-by-one until a suitable time span is found.
        for reservable_time_span in self.reservation_unit.origin_hauki_resource.reservable_time_spans.all():
            helper = ReservableTimeSpanFirstReservableTimeHelper(parent=self, reservable_time_span=reservable_time_span)
            output = helper.calculate_first_reservable_time()

            # If we have found a first reservable time, we can return early
            if output.first_reservable_time is not None:
                return output

            # The ReservationUnit is not closed. Save the value in case we don't find a first reservable time.
            if not output.is_closed and self.is_reservation_unit_closed:
                self.is_reservation_unit_closed = False

                # Now that we know that the ReservationUnit is not closed,
                # we can exit early if the maximum duration is invalid.
                if self.is_reservation_unit_max_duration_too_short:
                    return output

                # We don't have a first reservable time, but we know that the ReservationUnit is not closed.
                # Since soft-closed time spans don't affect the closed status, we can merge them with the
                # hard closed time spans, so that all future time span operations are faster, as we hopefully have
                # less overlapping closed time spans that need to be looped through.
                self.hard_closed_time_spans = merge_overlapping_time_span_elements(
                    self.hard_closed_time_spans,
                    self.soft_closed_time_spans,
                )
                self.soft_closed_time_spans = []

        return ReservableTimeOutput(is_closed=self.is_reservation_unit_closed, first_reservable_time=None)

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
