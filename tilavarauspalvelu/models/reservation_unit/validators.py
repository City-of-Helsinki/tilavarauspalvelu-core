from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING

from django.conf import settings
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationKind, ReservationTypeChoice, ReservationUnitPublishingState
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime, local_start_of_day

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.enums import PaymentType
    from tilavarauspalvelu.models import ReservationUnit, User

__all__ = [
    "ReservationUnitValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitValidator:
    reservation_unit: ReservationUnit

    def validate_reservation_unit_is_published(self) -> None:
        if self.reservation_unit.publishing_state not in ReservationUnitPublishingState.states_that_are_visible:
            msg = "Reservation unit is not currently published."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NOT_RESERVABLE)

    def validate_reservation_unit_is_reservable_at(self, begin: datetime.datetime) -> None:
        if not self.reservation_unit.actions.is_reservable_at(moment=begin):
            msg = "Reservation unit is not reservable at the time of the reservation."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NOT_RESERVABLE)

    def validate_user_is_adult_if_required(self, user: User) -> None:
        if not self.reservation_unit.require_adult_reservee:
            return

        # AD users are currently never under age since we have blocked students from signing in.
        if user.actions.is_ad_user:
            return

        if not user.actions.is_of_age:
            msg = "Reservation unit can only be booked by an adult reservee"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_ADULT_RESERVEE_REQUIRED)

    def validate_user_has_not_exceeded_max_reservations(self, user: User, *, ignore_ids: Collection[int] = ()) -> None:
        if self.reservation_unit.max_reservations_per_user is None:
            return

        qs = Reservation.objects.filter_for_user_num_active_reservations(self.reservation_unit, user)
        if ignore_ids:
            qs = qs.exclude(pk__in=ignore_ids)

        num_active_user_reservations = qs.count()
        if num_active_user_reservations >= self.reservation_unit.max_reservations_per_user:
            msg = "Maximum number of active reservations for this reservation unit exceeded."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MAX_NUMBER_OF_RESERVATIONS_EXCEEDED)

    def validate_reservation_unit_is_direct_bookable(self) -> None:
        if self.reservation_unit.reservation_kind == ReservationKind.SEASON:
            msg = "Reservation unit is not direct bookable."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NOT_DIRECT_BOOKABLE)

    def validate_begin_before_end(self, begin: datetime.datetime, end: datetime.datetime) -> None:
        if begin > end:
            msg = "Reservation cannot end before it begins"
            raise ValidationError(msg, code=error_codes.RESERVATION_DURATION_INVALID)

    def validate_duration_is_allowed(self, duration: datetime.timedelta) -> None:
        if duration <= datetime.timedelta():
            msg = "Reservation duration must be positive."
            raise ValidationError(msg, code=error_codes.RESERVATION_DURATION_INVALID)

        if self.reservation_unit.max_reservation_duration and duration > self.reservation_unit.max_reservation_duration:
            msg = "Reservation duration exceeds reservation unit's maximum allowed duration."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNITS_MAX_DURATION_EXCEEDED)

        if self.reservation_unit.min_reservation_duration and duration < self.reservation_unit.min_reservation_duration:
            msg = "Reservation duration is less than the reservation unit's minimum allowed duration."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED)

        interval_minutes = self.reservation_unit.actions.start_interval_minutes

        duration_minutes = duration.total_seconds() / 60
        if duration_minutes % interval_minutes > 0:
            msg = f"Reservation duration is not a multiple of the start interval of {interval_minutes} minutes."
            raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)

    def validate_reservation_begin_time(self, begin: datetime.datetime) -> None:
        if begin < local_datetime():
            msg = "Reservation cannot begin in the past."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_IN_PAST)

        if self.reservation_unit.allow_reservations_without_opening_hours:
            return

        possible_start_times = self.reservation_unit.actions.get_possible_start_times(begin.date())

        if begin.time() not in possible_start_times:
            msg = "Reservation start time does not match the reservation unit's allowed start interval."
            raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)

    def validate_reservation_begin_time_staff(self, begin: datetime.datetime) -> None:
        now = local_datetime()

        # Staff can move reservations to an earlier time today,
        # or yesterday if it's the first hour of the day.
        min_allowed_datetime = local_start_of_day(now)
        if now.hour == 0:
            min_allowed_datetime -= datetime.timedelta(days=1)

        if begin < min_allowed_datetime:
            msg = "Reservation cannot begin this much in the past."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_IN_PAST)

        possible_start_times = self.reservation_unit.actions.get_possible_start_times_staff(begin.date())

        if begin.time() not in possible_start_times:
            msg = "Reservation start time does not match the reservation unit's allowed start interval."
            raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)

    def validate_no_overlapping_reservations(
        self,
        begin: datetime.datetime,
        end: datetime.datetime,
        *,
        new_buffer_time_before: datetime.timedelta | None = None,
        new_buffer_time_after: datetime.timedelta | None = None,
        ignore_ids: Collection[int] = (),
    ) -> None:
        if self.reservation_unit.actions.has_overlapping_reservations(
            start_datetime=begin,
            end_datetime=end,
            buffer_time_before=new_buffer_time_before,
            buffer_time_after=new_buffer_time_after,
            ignore_ids=ignore_ids,
        ):
            msg = "Reservation overlaps with existing reservations."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

    def validate_reservation_days_before(self, begin: datetime.datetime) -> None:
        max_allowed = begin - local_datetime()
        min_required = begin - local_start_of_day()

        max_days_before = self.reservation_unit.reservations_max_days_before
        if max_days_before and max_allowed > datetime.timedelta(days=max_days_before):
            msg = f"Reservation start time is earlier than {max_days_before} days before."
            raise ValidationError(msg, code=error_codes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE)

        min_days_before = self.reservation_unit.reservations_min_days_before
        if min_days_before and min_required < datetime.timedelta(days=min_days_before):
            msg = f"Reservation start time is later than {min_days_before} days before."
            raise ValidationError(msg, code=error_codes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE)

    def validate_reservation_unit_is_open(self, begin: datetime.datetime, end: datetime.datetime) -> None:
        if self.reservation_unit.allow_reservations_without_opening_hours:
            return

        if not self.reservation_unit.actions.is_open(begin, end):
            msg = "Reservation unit is not open within desired reservation time."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NOT_RESERVABLE)

    def validate_not_in_open_application_round(self, begin: datetime.date, end: datetime.date) -> None:
        if self.reservation_unit.actions.is_in_open_application_round(begin, end):
            msg = "Reservation unit is in an open application round."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_IN_OPEN_ROUND)

    def validate_has_payment_type(self) -> None:
        payment_type = self.reservation_unit.actions.get_default_payment_type()
        if payment_type is None:
            msg = "Reservation might require payment, but reservation unit has no payment type defined"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_PAYMENT_TYPE)

    def validate_supports_payment_type(self, payment_type: PaymentType) -> None:
        supported = set(self.reservation_unit.payment_types.values_list("code", flat=True))
        if payment_type not in supported:
            msg = f"Reservation unit does not support the '{payment_type}' payment type."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_PAYMENT_TYPE)

    def validate_has_payment_product(self) -> None:
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            return

        if not self.reservation_unit.payment_product:
            msg = "Reservation unit is missing payment product"
            raise ValidationError(msg, code=error_codes.MISSING_PAYMENT_PRODUCT)

    def validate_cancellation_rule(self, begin: datetime.datetime) -> None:
        cancel_rule = self.reservation_unit.cancellation_rule
        if cancel_rule is None:
            msg = "Reservation cannot be changed because it has no cancellation rule."
            raise ValidationError(msg, code=error_codes.CANCELLATION_NOT_ALLOWED)

        now = local_datetime()
        cancel_period = cancel_rule.can_be_cancelled_time_before or datetime.timedelta()
        last_cancellable_moment = begin - cancel_period

        if now > last_cancellable_moment:
            msg = "Reservation time cannot be changed because the cancellation period has expired."
            raise ValidationError(msg, code=error_codes.CANCELLATION_TIME_PAST)

    def validate_not_paid_at(self, begin: datetime.datetime) -> None:
        pricing = self.reservation_unit.actions.get_active_pricing(by_date=begin.date())

        if pricing is None:
            msg = "Reservation cannot be rescheduled since it has no active pricing."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        if pricing.highest_price > 0:
            msg = "Reservation cannot be rescheduled to a point where it would become paid."
            raise ValidationError(msg, code=error_codes.RESERVATION_MODIFICATION_NOT_ALLOWED)

    def validate_can_create_reservation_type(self, reservation_type: ReservationTypeChoice) -> None:
        if reservation_type not in ReservationTypeChoice.types_that_staff_can_create:
            msg = "Staff users are not allowed to create reservations of this type."
            raise ValidationError(msg, code=error_codes.RESERVATION_TYPE_NOT_ALLOWED)
