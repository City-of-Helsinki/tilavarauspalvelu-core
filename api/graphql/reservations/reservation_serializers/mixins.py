import datetime
import math
from decimal import Decimal
from typing import Iterable

from django.utils import timezone
from django.utils.timezone import get_default_timezone

from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservation_units.enums import ReservationUnitState
from reservation_units.models import PriceUnit, PricingType, ReservationUnit
from reservation_units.utils.reservation_unit_pricing_helper import (
    ReservationUnitPricingHelper,
)


class PriceCalculationResult:
    reservation_price: Decimal = Decimal("0")
    reservation_price_net: Decimal = Decimal("0")
    unit_price: Decimal = Decimal("0")
    tax_percentage: Decimal = Decimal("0")
    non_subsidised_price: Decimal = Decimal("0")
    non_subsidised_price_net: Decimal = Decimal("0")
    subsidised_price: Decimal = Decimal("0")

    def __init__(
        self,
        reservation_price: Decimal,
        reservation_price_net: Decimal,
        unit_price: Decimal,
        tax_percentage: Decimal,
        non_subsidised_price: Decimal,
        non_subsidised_price_net: Decimal,
        subsidised_price: Decimal,
        subsidised_price_net: Decimal,
    ) -> None:
        self.reservation_price = reservation_price
        self.reservation_price_net = reservation_price_net
        self.unit_price = unit_price
        self.tax_percentage = tax_percentage
        self.non_subsidised_price = non_subsidised_price
        self.non_subsidised_price_net = non_subsidised_price_net
        self.subsidised_price = subsidised_price
        self.subsidised_price_net = subsidised_price_net


class ReservationPriceMixin:
    """Validation methods for pricing related operations"""

    def requires_price_calculation(self, data):
        # If pk is not given, this is a create request -> price is always calculated
        if "pk" not in data:
            return True

        if "begin" in data and self.instance.begin != data["begin"]:
            return True

        if "end" in data and self.instance.end != data["end"]:
            return True

        if "reservation_unit" in data:
            existing_unit_ids = []
            for unit in self.instance.reservation_unit.all():
                existing_unit_ids.append(unit.pk)

            new_unit_ids = []
            for unit in data["reservation_unit"]:
                new_unit_ids.append(unit.pk)

            if set(existing_unit_ids) != set(new_unit_ids):
                return True

        return False

    def calculate_price(
        self,
        begin: datetime.datetime,
        end: datetime.datetime,
        reservation_units: Iterable[ReservationUnit],
    ) -> PriceCalculationResult:
        price_unit_to_minutes = {
            PriceUnit.PRICE_UNIT_PER_15_MINS: 15,
            PriceUnit.PRICE_UNIT_PER_30_MINS: 30,
            PriceUnit.PRICE_UNIT_PER_HOUR: 60,
            PriceUnit.PRICE_UNIT_PER_HALF_DAY: 720,
            PriceUnit.PRICE_UNIT_PER_DAY: 1440,
            PriceUnit.PRICE_UNIT_PER_WEEK: 10080,
        }

        fixed_price_units = [
            PriceUnit.PRICE_UNIT_FIXED,
            PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            PriceUnit.PRICE_UNIT_PER_DAY,
            PriceUnit.PRICE_UNIT_PER_WEEK,
        ]

        total_reservation_price: Decimal = Decimal("0")
        total_reservation_price_net: Decimal = Decimal("0")

        total_reservation_subsidised_price: Decimal = Decimal("0")
        total_reservation_subsidised_price_net: Decimal = Decimal("0")

        first_paid_unit_price: Decimal = Decimal("0")
        first_paid_unit_tax_percentage: Decimal = Decimal("0")
        is_first_paid_set = False

        for reservation_unit in reservation_units:
            pricing = ReservationUnitPricingHelper.get_price_by_date(
                reservation_unit, begin.date()
            )
            # If unit pricing type is not PAID, there is no need for calculations. Skip.
            if pricing is None or pricing.pricing_type != PricingType.PAID:
                break

            max_price = max(pricing.lowest_price, pricing.highest_price)
            reservation_unit_price = unit_price = max_price

            # Use same equivalent net price that with vat price.
            # This is merely a cautionary check since this should be highest_price_net.
            reservation_unit_price_net = (
                pricing.highest_price_net
                if max_price == pricing.highest_price
                else pricing.lowest_price_net
            )

            # Subsidised price is always the lowest price.
            reservation_unit_subsidised_price = pricing.lowest_price
            reservation_unit_subsidised_price_net = pricing.lowest_price_net

            # Time-based calculation is needed only if price unit is not fixed.
            # Otherwise, we can just use the price defined in the reservation unit
            if pricing.price_unit not in fixed_price_units:
                reservation_duration_in_minutes = (end - begin).seconds / Decimal("60")

                # Prices are calculated based on the 15 minutes intervals rounded up
                reservation_duration_in_15mins = math.ceil(
                    reservation_duration_in_minutes / Decimal("15")
                )

                reservation_unit_price_unit_minutes = price_unit_to_minutes.get(
                    pricing.price_unit
                )
                reservation_unit_price_per_15min = (
                    reservation_unit_price_net
                    / reservation_unit_price_unit_minutes
                    * Decimal("15")
                )

                reservation_unit_price_net = Decimal(
                    reservation_duration_in_15mins * reservation_unit_price_per_15min
                )

                reservation_unit_price = reservation_unit_price_net * (
                    1 + pricing.tax_percentage.decimal
                )

                reservation_unit_subsidised_price_net = Decimal(
                    reservation_duration_in_15mins * reservation_unit_price_per_15min
                )

                reservation_unit_subsidised_price = (
                    reservation_unit_subsidised_price_net
                    * (1 + pricing.tax_percentage.decimal)
                )

            # It was agreed in TILA-1765 that when multiple units are given,
            # unit price and tax percentage are fetched from the FIRST unit.
            # https://helsinkisolutionoffice.atlassian.net/browse/TILA-1765
            if not is_first_paid_set:
                first_paid_unit_price = unit_price
                first_paid_unit_tax_percentage = pricing.tax_percentage.value
                is_first_paid_set = True

            total_reservation_price += reservation_unit_price
            total_reservation_price_net += reservation_unit_price_net
            total_reservation_subsidised_price += reservation_unit_subsidised_price
            total_reservation_subsidised_price_net += (
                reservation_unit_subsidised_price_net
            )

        non_subsidised_price = total_reservation_price
        non_subsidised_price_net = total_reservation_price_net

        return PriceCalculationResult(
            total_reservation_price,
            total_reservation_price_net,
            first_paid_unit_price,
            first_paid_unit_tax_percentage,
            non_subsidised_price,
            non_subsidised_price_net,
            total_reservation_subsidised_price,
            total_reservation_subsidised_price_net,
        )


class ReservationSchedulingMixin:
    """Common mixin class for reservations containing date and scheduling related checks"""

    @classmethod
    def _get_invalid_begin(cls, reservation_unit, now: datetime.datetime):
        return (
            reservation_unit.reservation_begins
            and now < reservation_unit.reservation_begins
        ) or (reservation_unit.publish_begins and now < reservation_unit.publish_begins)

    @classmethod
    def _get_invalid_end(
        cls, reservation_unit: ReservationUnit, now: datetime.datetime
    ):
        reservation_in_reservations_closed_period = (
            reservation_unit.reservation_ends
            and now >= reservation_unit.reservation_ends
            and (
                reservation_unit.reservation_begins is None
                or reservation_unit.reservation_begins
                <= reservation_unit.reservation_ends
            )
        )

        reservation_in_non_published_reservation_unit = (
            reservation_unit.publish_ends
            and now >= reservation_unit.publish_ends
            and (
                reservation_unit.publish_begins is None
                or (reservation_unit.publish_begins <= reservation_unit.publish_ends)
            )
        )
        return (
            reservation_in_reservations_closed_period
            or reservation_in_non_published_reservation_unit
        )

    def check_reservation_time(self, reservation_unit: ReservationUnit):
        state = reservation_unit.state
        if (
            state == ReservationUnitState.DRAFT
            or state == ReservationUnitState.ARCHIVED
        ):
            raise ValidationErrorWithCode(
                f"Reservation unit is not reservable due to status is {state}.",
                ValidationErrorCodes.RESERVATION_UNIT_NOT_RESERVABLE,
            )

        now = timezone.now()

        is_invalid_begin = self._get_invalid_begin(reservation_unit, now)

        is_invalid_end = self._get_invalid_end(reservation_unit, now)

        if is_invalid_begin or is_invalid_end:
            raise ValidationErrorWithCode(
                "Reservation unit is not reservable at current time.",
                ValidationErrorCodes.RESERVATION_UNIT_NOT_RESERVABLE,
            )

    def check_reservation_overlap(self, reservation_unit: ReservationUnit, begin, end):
        if reservation_unit.check_reservation_overlap(begin, end, self.instance):
            raise ValidationErrorWithCode(
                "Overlapping reservations are not allowed.",
                ValidationErrorCodes.OVERLAPPING_RESERVATIONS,
            )

    def check_opening_hours(self, scheduler, begin, end):
        is_reservation_unit_open = scheduler.is_reservation_unit_open(begin, end)
        if (
            not scheduler.reservation_unit.allow_reservations_without_opening_hours
            and not is_reservation_unit_open
        ):
            raise ValidationErrorWithCode(
                "Reservation unit is not open within desired reservation time.",
                ValidationErrorCodes.RESERVATION_UNIT_IS_NOT_OPEN,
            )

    def check_reservation_duration(self, reservation_unit: ReservationUnit, begin, end):
        duration = end - begin
        if (
            reservation_unit.max_reservation_duration
            and duration.total_seconds()
            > reservation_unit.max_reservation_duration.total_seconds()
        ):
            raise ValidationErrorWithCode(
                "Reservation duration exceeds one or more reservation unit's maximum duration.",
                ValidationErrorCodes.RESERVATION_UNITS_MAX_DURATION_EXCEEDED,
            )

        if (
            reservation_unit.min_reservation_duration
            and duration.total_seconds()
            < reservation_unit.min_reservation_duration.total_seconds()
        ):
            raise ValidationErrorWithCode(
                "Reservation duration less than one or more reservation unit's minimum duration.",
                ValidationErrorCodes.RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED,
            )

        interval_minutes = int(
            reservation_unit.reservation_start_interval.replace(
                "interval_", ""
            ).replace("_mins", "")
        )
        duration_minutes = duration.total_seconds() / 60
        if duration_minutes % interval_minutes > 0:
            raise ValidationErrorWithCode(
                f"Reservation duration is not a multiple of the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )

    def check_buffer_times(self, reservation_unit, begin, end):
        reservation_after = reservation_unit.get_next_reservation(end, self.instance)
        reservation_before = reservation_unit.get_previous_reservation(
            begin, self.instance
        )

        buffer_before = max(
            [
                buffer
                for buffer in (
                    getattr(reservation_before, "buffer_time_after", None),
                    reservation_unit.buffer_time_before,
                )
                if buffer
            ],
            default=None,
        )

        buffer_after = max(
            [
                buffer
                for buffer in (
                    getattr(reservation_after, "buffer_time_before", None),
                    reservation_unit.buffer_time_after,
                )
                if buffer
            ],
            default=None,
        )

        if (
            reservation_before
            and buffer_before
            and (reservation_before.end + buffer_before) > begin
        ):
            raise ValidationErrorWithCode(
                "Reservation overlaps with reservation before due to buffer time.",
                ValidationErrorCodes.RESERVATION_OVERLAP,
            )

        if (
            reservation_after
            and buffer_after
            and (reservation_after.begin - buffer_after) < end
        ):
            raise ValidationErrorWithCode(
                "Reservation overlaps with reservation after due to buffer time.",
                ValidationErrorCodes.RESERVATION_OVERLAP,
            )

    def check_reservation_start_time(self, scheduler, begin):
        if scheduler.reservation_unit.allow_reservations_without_opening_hours:
            return

        interval_to_minutes = {
            ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES: 15,
            ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES: 30,
            ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES: 60,
            ReservationUnit.RESERVATION_START_INTERVAL_90_MINUTES: 90,
        }
        interval = scheduler.reservation_unit.reservation_start_interval
        interval_minutes = interval_to_minutes[interval]
        interval_timedelta = datetime.timedelta(minutes=interval_minutes)
        possible_start_times = scheduler.get_reservation_unit_possible_start_times(
            begin, interval_timedelta
        )
        if begin not in possible_start_times:
            raise ValidationErrorWithCode(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )

    def check_reservation_days_before(self, begin, reservation_unit):
        now = datetime.datetime.now().astimezone(get_default_timezone())
        start_of_the_day = datetime.datetime.combine(now, datetime.time.min).astimezone(
            get_default_timezone()
        )

        if reservation_unit.reservations_max_days_before and now < (
            begin
            - datetime.timedelta(days=reservation_unit.reservations_max_days_before)
        ):
            raise ValidationErrorWithCode(
                f"Reservation start time is earlier than {reservation_unit.reservations_max_days_before} days before.",
                ValidationErrorCodes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE,
            )

        if reservation_unit.reservations_min_days_before and start_of_the_day > (
            begin
            - datetime.timedelta(days=reservation_unit.reservations_min_days_before)
        ):
            raise ValidationErrorWithCode(
                f"Reservation start time is less than {reservation_unit.reservations_min_days_before} days before.",
                ValidationErrorCodes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE,
            )

    def check_open_application_round(self, scheduler, begin, end):
        open_app_round = scheduler.get_conflicting_open_application_round(
            begin.date(), end.date()
        )

        if open_app_round:
            raise ValidationErrorWithCode(
                "One or more reservation units are in open application round.",
                ValidationErrorCodes.RESERVATION_UNIT_IN_OPEN_ROUND,
            )

    def check_reservation_intervals_for_staff_reservation(
        self, reservation_unit, begin
    ):
        interval_to_minutes = {
            ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES: 15,
            ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES: 30,
            ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES: 60,
            ReservationUnit.RESERVATION_START_INTERVAL_90_MINUTES: 90,
        }
        interval = (
            reservation_unit.reservation_start_interval
            or ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES
        )
        interval_minutes = interval_to_minutes[interval]
        interval_timedelta = datetime.timedelta(minutes=interval_minutes)
        possible_start_times = set()

        start_time = datetime.datetime.combine(
            begin.date(), datetime.time()
        ).astimezone(get_default_timezone())
        end_time = start_time + datetime.timedelta(hours=23, minutes=59, seconds=59)
        while start_time < end_time:
            possible_start_times.add(start_time.time())
            start_time += interval_timedelta

        if begin.time() not in possible_start_times:
            raise ValidationErrorWithCode(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )
