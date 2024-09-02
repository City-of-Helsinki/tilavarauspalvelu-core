import datetime
import math
from collections.abc import Iterable
from decimal import Decimal
from typing import Any

from django.utils import timezone
from django.utils.timezone import get_default_timezone

from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from api.graphql.types.reservation.types import ReservationNode
from common.date_utils import local_datetime, local_start_of_day
from reservation_units.enums import PriceUnit, PricingType, ReservationStartInterval, ReservationUnitState
from reservation_units.models import ReservationUnit
from reservations.enums import ReservationTypeChoice
from reservations.models import Reservation


class PriceCalculationResult:
    instance: Reservation

    reservation_price: Decimal = Decimal("0")
    unit_price: Decimal = Decimal("0")
    tax_percentage_value: Decimal = Decimal("0")
    non_subsidised_price: Decimal = Decimal("0")
    subsidised_price: Decimal = Decimal("0")

    def __init__(
        self,
        reservation_price: Decimal,
        unit_price: Decimal,
        tax_percentage_value: Decimal,
        non_subsidised_price: Decimal,
        subsidised_price: Decimal,
    ) -> None:
        self.reservation_price = reservation_price
        self.unit_price = unit_price
        self.tax_percentage_value = tax_percentage_value
        self.non_subsidised_price = non_subsidised_price
        self.subsidised_price = subsidised_price

    @property
    def _tax_percentage_multiplier(self) -> Decimal:
        return 1 + self.tax_percentage_value / 100

    @property
    def reservation_price_net(self) -> Decimal:
        return self.reservation_price / self._tax_percentage_multiplier

    @property
    def non_subsidised_price_net(self) -> Decimal:
        return self.non_subsidised_price / self._tax_percentage_multiplier

    @property
    def subsidised_price_net(self) -> Decimal:
        return self.subsidised_price / self._tax_percentage_multiplier


class ReservationPriceMixin:
    """Validation methods for pricing related operations"""

    instance: Reservation

    def requires_price_calculation(self, data: dict[str, Any]) -> bool:
        # If pk is not given, this is a create request -> price is always calculated
        if "pk" not in data:
            return True

        if "begin" in data and self.instance.begin != data["begin"]:
            return True

        if "end" in data and self.instance.end != data["end"]:
            return True

        if "reservation_unit" in data:
            existing_unit_ids = set(self.instance.reservation_unit.values_list("pk", flat=True))
            new_unit_ids = {unit.pk for unit in data["reservation_unit"]}

            if existing_unit_ids != new_unit_ids:
                return True

        return False

    @staticmethod
    def calculate_price(
        begin_datetime: datetime.datetime,
        end_datetime: datetime.datetime,
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

        calculation_result = PriceCalculationResult(
            reservation_price=Decimal("0"),
            unit_price=Decimal("0"),
            tax_percentage_value=Decimal("0"),
            non_subsidised_price=Decimal("0"),
            subsidised_price=Decimal("0"),
        )

        for reservation_unit in reservation_units:
            pricing = reservation_unit.actions.get_active_pricing(by_date=begin_datetime.date())

            # If unit pricing type is not PAID, there is no need for calculations, skip to next reservation unit
            if pricing is None or pricing.pricing_type != PricingType.PAID:
                continue

            price = pricing.highest_price
            subsidised_price = pricing.lowest_price  # Subsidised price is always the lowest price.

            # Time-based calculation is needed only if price unit is not fixed.
            # Otherwise, we can just use the price defined in the reservation unit
            if pricing.price_unit not in fixed_price_units:
                duration_minutes = (end_datetime - begin_datetime).total_seconds() / 60
                # Price calculations use duration rounded to the next 15 minutes
                duration_minutes = Decimal(math.ceil(duration_minutes / 15) * 15)

                price_unit_minutes: int = price_unit_to_minutes.get(pricing.price_unit)
                price_per_minute = price / price_unit_minutes
                subsidised_price_per_minute = subsidised_price / price_unit_minutes

                price = duration_minutes * price_per_minute
                subsidised_price = duration_minutes * subsidised_price_per_minute

            # Add the reservation unit calculated price to the total price
            calculation_result.reservation_price += price
            calculation_result.non_subsidised_price += price
            calculation_result.subsidised_price += subsidised_price

            # It was agreed in TILA-1765 that when multiple units are given,
            # unit price and tax percentage are fetched from the FIRST reservation unit.
            # https://helsinkisolutionoffice.atlassian.net/browse/TILA-1765
            if not calculation_result.unit_price:
                calculation_result.unit_price = pricing.highest_price
                calculation_result.tax_percentage_value = pricing.tax_percentage.value

        return calculation_result


class ReservationSchedulingMixin:
    """Common mixin class for reservations containing date and scheduling related checks"""

    instance: Reservation | None

    @classmethod
    def _get_invalid_begin(cls, reservation_unit, now: datetime.datetime):
        return (reservation_unit.reservation_begins and now < reservation_unit.reservation_begins) or (
            reservation_unit.publish_begins and now < reservation_unit.publish_begins
        )

    @classmethod
    def _get_invalid_end(cls, reservation_unit: ReservationUnit, now: datetime.datetime):
        reservation_in_reservations_closed_period = (
            reservation_unit.reservation_ends
            and now >= reservation_unit.reservation_ends
            and (
                reservation_unit.reservation_begins is None
                or reservation_unit.reservation_begins <= reservation_unit.reservation_ends
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
        return reservation_in_reservations_closed_period or reservation_in_non_published_reservation_unit

    def check_reservation_time(self, reservation_unit: ReservationUnit) -> None:
        state = reservation_unit.state
        if state in (ReservationUnitState.DRAFT, ReservationUnitState.ARCHIVED):
            raise ValidationErrorWithCode(
                f"Reservation unit is not reservable due to its status: '{state.value}'.",
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

    def check_reservation_overlap(
        self,
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
    ) -> None:
        if reservation_unit.actions.check_reservation_overlap(begin, end, self.instance):
            raise ValidationErrorWithCode(
                "Overlapping reservations are not allowed.",
                ValidationErrorCodes.OVERLAPPING_RESERVATIONS,
            )

    @staticmethod
    def check_opening_hours(
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
    ) -> None:
        is_open = reservation_unit.actions.is_open(begin, end)
        if not reservation_unit.allow_reservations_without_opening_hours and not is_open:
            raise ValidationErrorWithCode(
                "Reservation unit is not open within desired reservation time.",
                ValidationErrorCodes.RESERVATION_UNIT_IS_NOT_OPEN,
            )

    @staticmethod
    def check_reservation_duration(
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
    ) -> None:
        duration: datetime.timedelta = end - begin

        if reservation_unit.max_reservation_duration and duration > reservation_unit.max_reservation_duration:
            raise ValidationErrorWithCode(
                "Reservation duration exceeds one or more reservation unit's maximum duration.",
                ValidationErrorCodes.RESERVATION_UNITS_MAX_DURATION_EXCEEDED,
            )

        if reservation_unit.min_reservation_duration and duration < reservation_unit.min_reservation_duration:
            raise ValidationErrorWithCode(
                "Reservation duration less than one or more reservation unit's minimum duration.",
                ValidationErrorCodes.RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED,
            )

        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number
        duration_minutes = duration.total_seconds() / 60
        if duration_minutes % interval_minutes > 0:
            raise ValidationErrorWithCode(
                f"Reservation duration is not a multiple of the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )

    def check_buffer_times(
        self,
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
        reservation_type: ReservationNode | None = None,
        new_buffer_before: datetime.timedelta | None = None,
        new_buffer_after: datetime.timedelta | None = None,
    ) -> None:
        current_type = getattr(self.instance, "type", reservation_type)
        if current_type == ReservationTypeChoice.BLOCKED:
            return

        # Can't set buffers for whole day reservations
        if reservation_unit.reservation_block_whole_day:
            new_buffer_before = None
            new_buffer_after = None

        buffer_before: datetime.timedelta = (
            new_buffer_before
            if new_buffer_before is not None
            else reservation_unit.actions.get_actual_before_buffer(begin)
        )
        previous_reservation = reservation_unit.actions.get_previous_reservation(
            begin, self.instance, exclude_blocked=True
        )
        if previous_reservation:
            previous_buffer = previous_reservation.buffer_time_after
            buffer_before = max(previous_buffer, buffer_before)

        buffer_after: datetime.timedelta = (
            new_buffer_after
            if new_buffer_after is not None  # for formatting
            else reservation_unit.actions.get_actual_after_buffer(end)
        )
        next_reservation = reservation_unit.actions.get_next_reservation(end, self.instance, exclude_blocked=True)
        if next_reservation:
            next_buffer = next_reservation.buffer_time_before
            buffer_after = max(next_buffer, buffer_after)

        if previous_reservation and buffer_before and (previous_reservation.end + buffer_before) > begin:
            raise ValidationErrorWithCode(
                "Reservation overlaps with reservation before due to buffer time.",
                ValidationErrorCodes.RESERVATION_OVERLAP,
            )

        if next_reservation and buffer_after and (next_reservation.begin - buffer_after) < end:
            raise ValidationErrorWithCode(
                "Reservation overlaps with reservation after due to buffer time.",
                ValidationErrorCodes.RESERVATION_OVERLAP,
            )

    @staticmethod
    def check_reservation_start_time(reservation_unit: ReservationUnit, begin: datetime.datetime) -> None:
        if reservation_unit.allow_reservations_without_opening_hours:
            return

        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number
        possible_start_times = reservation_unit.actions.get_possible_start_times(begin.date(), interval_minutes)
        if begin not in possible_start_times:
            raise ValidationErrorWithCode(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )

    @staticmethod
    def check_reservation_days_before(begin: datetime.datetime, reservation_unit: ReservationUnit) -> None:
        max_days_before = reservation_unit.reservations_max_days_before
        if max_days_before and (begin - local_datetime()) > datetime.timedelta(days=max_days_before):
            raise ValidationErrorWithCode(
                f"Reservation start time is earlier than {reservation_unit.reservations_max_days_before} days before.",
                ValidationErrorCodes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE,
            )

        min_days_before = reservation_unit.reservations_min_days_before
        if min_days_before and (begin - local_start_of_day()) < datetime.timedelta(days=min_days_before):
            raise ValidationErrorWithCode(
                f"Reservation start time is later than {reservation_unit.reservations_min_days_before} days before.",
                ValidationErrorCodes.RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE,
            )

    @staticmethod
    def check_open_application_round(
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
        end: datetime.datetime,
    ) -> None:
        open_app_round = reservation_unit.actions.is_in_open_application_round(begin.date(), end.date())

        if open_app_round:
            raise ValidationErrorWithCode(
                "One or more reservation units are in open application round.",
                ValidationErrorCodes.RESERVATION_UNIT_IN_OPEN_ROUND,
            )

    @staticmethod
    def check_reservation_intervals_for_staff_reservation(
        reservation_unit: ReservationUnit,
        begin: datetime.datetime,
    ) -> None:
        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        # Staff reservations ignore start intervals longer than 30 minutes
        if interval_minutes != 15:
            interval_minutes = 30

        interval_timedelta = datetime.timedelta(minutes=interval_minutes)
        possible_start_times = set()

        start_time = datetime.datetime.combine(begin.date(), datetime.time()).astimezone(get_default_timezone())
        end_time = start_time + datetime.timedelta(hours=23, minutes=59, seconds=59)
        while start_time < end_time:
            possible_start_times.add(start_time.time())
            start_time += interval_timedelta

        if begin.time() not in possible_start_times:
            raise ValidationErrorWithCode(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )
