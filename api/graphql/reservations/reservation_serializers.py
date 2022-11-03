import datetime
import math
from decimal import Decimal
from typing import List, Optional

from django.utils.timezone import get_default_timezone
from graphene.utils.str_converters import to_camel_case
from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.choice_char_field import ChoiceCharField
from api.graphql.duration_field import DurationField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from applications.models import CUSTOMER_TYPES, City
from email_notification.models import EmailType
from email_notification.tasks import (
    send_reservation_email_task,
    send_staff_reservation_email_task,
)
from merchants.models import Language, PaymentOrder, PaymentStatus
from merchants.verkkokauppa.helpers import create_verkkokauppa_order
from permissions.helpers import can_handle_reservation_with_units
from reservation_units.models import (
    PaymentType,
    PriceUnit,
    PricingType,
    ReservationKind,
    ReservationUnit,
)
from reservation_units.utils.reservation_unit_pricing_helper import (
    ReservationUnitPricingHelper,
)
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import (
    RESERVEE_LANGUAGE_CHOICES,
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationPurpose,
    ReservationType,
)
from users.models import ReservationNotification
from utils.decimal_utils import round_decimal

from ..application_errors import ValidationErrorCodes, ValidationErrorWithCode

DEFAULT_TIMEZONE = get_default_timezone()

RESERVATION_STATE_EMAIL_TYPE_MAP = {
    STATE_CHOICES.CONFIRMED: EmailType.RESERVATION_CONFIRMED,
    STATE_CHOICES.REQUIRES_HANDLING: EmailType.HANDLING_REQUIRED_RESERVATION,
    STATE_CHOICES.CANCELLED: EmailType.RESERVATION_CANCELLED,
    STATE_CHOICES.DENIED: EmailType.RESERVATION_REJECTED,
    "APPROVED": EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
    "NEEDS_PAYMENT": EmailType.RESERVATION_NEEDS_TO_BE_PAID,
}


class PriceCalculationResult:
    reservation_price: Decimal = Decimal("0")
    reservation_price_net: Decimal = Decimal("0")
    unit_price: Decimal = Decimal("0")
    tax_percentage: Decimal = Decimal("0")
    non_subsidised_price: Decimal = Decimal("0")
    non_subsidised_price_net: Decimal = Decimal("0")

    def __init__(
        self,
        reservation_price: Decimal,
        reservation_price_net: Decimal,
        unit_price: Decimal,
        tax_percentage: Decimal,
        non_subsidised_price: Decimal,
        non_subsidised_price_net: Decimal,
    ) -> None:
        self.reservation_price = reservation_price
        self.reservation_price_net = reservation_price_net
        self.unit_price = unit_price
        self.tax_percentage = tax_percentage
        self.non_subsidised_price = non_subsidised_price
        self.non_subsidised_price_net = non_subsidised_price_net


class ReservationCreateSerializer(PrimaryKeySerializer):
    state = ChoiceCharField(
        help_text="Read only string value for ReservationType's ReservationState enum.",
        choices=STATE_CHOICES.STATE_CHOICES,
    )
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
    )
    priority = serializers.IntegerField(required=False)
    purpose_pk = IntegerPrimaryKeyField(
        queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True
    )
    home_city_pk = IntegerPrimaryKeyField(
        queryset=City.objects.all(), source="home_city", allow_null=True
    )
    age_group_pk = IntegerPrimaryKeyField(
        queryset=AgeGroup.objects.all(), source="age_group", allow_null=True
    )
    reservee_type = ChoiceCharField(
        choices=CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES,
        help_text=(
            "Type of the reservee. "
            f"Possible values are {', '.join(value[0].upper() for value in CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES)}."
        ),
    )
    reservee_language = ChoiceCharField(
        choices=RESERVEE_LANGUAGE_CHOICES, required=False, default=""
    )
    buffer_time_before = DurationField(required=False)
    buffer_time_after = DurationField(required=False)
    type = ChoiceCharField(
        required=False,
        choices=ReservationType.choices,
        help_text=(
            "Reservation type. Mutation requires special permissions. Possible values are "
            f"{', '.join(value.upper() for value in ReservationType)}."
        ),
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_email",
            "reservee_type",
            "reservee_id",
            "reservee_is_unregistered_association",
            "reservee_language",
            "home_city_pk",
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            "age_group_pk",
            "billing_first_name",
            "billing_last_name",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            "billing_phone",
            "billing_email",
            "num_persons",
            "name",
            "description",
            "state",
            "priority",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_unit_pks",
            "purpose_pk",
            "confirmed_at",
            "unit_price",
            "tax_percentage_value",
            "price",
            "price_net",
            "non_subsidised_price",
            "non_subsidised_price_net",
            "staff_event",
            "type",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["reservation_unit_pks"].write_only = True
        self.fields["confirmed_at"].read_only = True
        self.fields["unit_price"].read_only = True
        self.fields["tax_percentage_value"].read_only = True
        self.fields["price"].read_only = True
        self.fields["price_net"].read_only = True
        self.fields["non_subsidised_price"].read_only = True
        self.fields["non_subsidised_price_net"].read_only = True

        # Form/metadata fields should be optional by default
        self.fields["reservee_type"].required = False
        self.fields["reservee_first_name"].required = False
        self.fields["reservee_last_name"].required = False
        self.fields["reservee_organisation_name"].required = False
        self.fields["reservee_phone"].required = False
        self.fields["reservee_email"].required = False
        self.fields["reservee_id"].required = False
        self.fields["reservee_is_unregistered_association"].required = False
        self.fields["reservee_address_street"].required = False
        self.fields["reservee_address_city"].required = False
        self.fields["reservee_address_zip"].required = False
        self.fields["billing_first_name"].required = False
        self.fields["billing_last_name"].required = False
        self.fields["billing_phone"].required = False
        self.fields["billing_email"].required = False
        self.fields["billing_address_street"].required = False
        self.fields["billing_address_city"].required = False
        self.fields["billing_address_zip"].required = False
        self.fields["home_city_pk"].required = False
        self.fields["age_group_pk"].required = False
        self.fields["applying_for_free_of_charge"].required = False
        self.fields["free_of_charge_reason"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["num_persons"].required = False
        self.fields["purpose_pk"].required = False

    def validate(self, data):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))
        begin = begin.astimezone(DEFAULT_TIMEZONE)
        end = end.astimezone(DEFAULT_TIMEZONE)

        reservation_units = data.get(
            "reservation_unit", getattr(self.instance, "reservation_unit", None)
        )
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()

        sku = None
        for reservation_unit in reservation_units:
            self.check_reservation_time(reservation_unit, begin, end)
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_reservation_duration(reservation_unit, begin, end)
            self.check_buffer_times(data, reservation_unit)
            self.check_reservation_days_before(begin, reservation_unit)
            self.check_max_reservations_per_user(
                self.context.get("request").user, reservation_unit
            )
            self.check_sku(sku, reservation_unit.sku)
            self.check_reservation_kind(reservation_unit)

            # Scheduler dependent checks.
            scheduler = ReservationUnitReservationScheduler(
                reservation_unit, opening_hours_end=end.date()
            )
            self.check_opening_hours(scheduler, begin, end)
            self.check_open_application_round(scheduler, begin, end)
            self.check_reservation_start_time(begin, scheduler)

            sku = reservation_unit.sku

        data["sku"] = sku
        data["state"] = STATE_CHOICES.CREATED
        data[
            "buffer_time_before"
        ] = self._get_biggest_buffer_time_from_reservation_units(
            "buffer_time_before", reservation_units
        )
        data[
            "buffer_time_after"
        ] = self._get_biggest_buffer_time_from_reservation_units(
            "buffer_time_after", reservation_units
        )
        user = self.context.get("request").user
        if user.is_anonymous:
            user = None

        data["user"] = user

        if self.requires_price_calculation(data):
            price_calculation_result = self.calculate_price(
                begin, end, reservation_units
            )
            data["price"] = price_calculation_result.reservation_price
            data["unit_price"] = price_calculation_result.unit_price
            data["tax_percentage_value"] = price_calculation_result.tax_percentage
            data["price_net"] = price_calculation_result.reservation_price_net
            data["non_subsidised_price"] = price_calculation_result.non_subsidised_price
            data[
                "non_subsidised_price_net"
            ] = price_calculation_result.non_subsidised_price_net

        staff_event = data.get("staff_event", None)
        reservation_type = data.get("type", None)
        reservation_unit_ids = list(map(lambda x: x.pk, reservation_units))
        self.check_staff_event(user, reservation_unit_ids, staff_event)
        self.check_reservation_type(user, reservation_unit_ids, reservation_type)

        return data

    def check_reservation_time(self, reservation_unit: ReservationUnit, begin, end):
        is_invalid_begin = (
            reservation_unit.reservation_begins
            and begin < reservation_unit.reservation_begins
        )
        is_invalid_end = (
            reservation_unit.reservation_ends
            and end > reservation_unit.reservation_ends
        )

        if is_invalid_begin or is_invalid_end:
            raise ValidationErrorWithCode(
                "Reservation unit is not reservable within this reservation time.",
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

    def check_open_application_round(self, scheduler, begin, end):
        open_app_round = scheduler.get_conflicting_open_application_round(
            begin.date(), end.date()
        )

        if open_app_round:
            raise ValidationErrorWithCode(
                "One or more reservation units are in open application round.",
                ValidationErrorCodes.RESERVATION_UNIT_IN_OPEN_ROUND,
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

    def _get_biggest_buffer_time_from_reservation_units(
        self, field: str, reservation_units: List[ReservationUnit]
    ) -> [datetime.timedelta]:
        buffer_times = [
            getattr(res_unit, field)
            for res_unit in reservation_units
            if getattr(res_unit, field, None) is not None
        ]
        return max(buffer_times, default=None)

    def check_sku(self, current_sku, new_sku):
        if current_sku is not None and current_sku != new_sku:
            raise ValidationErrorWithCode(
                "An ambiguous SKU cannot be assigned for this reservation.",
                ValidationErrorCodes.AMBIGUOUS_SKU,
            )

    def check_max_reservations_per_user(self, user, reservation_unit):
        max_count = reservation_unit.max_reservations_per_user
        if max_count is not None:
            current_reservation_pk = getattr(self.instance, "pk", None)
            reservation_count = (
                Reservation.objects.filter(user=user)
                .exclude(pk=current_reservation_pk)
                .active()
                .count()
            )
            if reservation_count >= max_count:
                raise ValidationErrorWithCode(
                    "Maximum number of active reservations for this reservation unit exceeded.",
                    ValidationErrorCodes.MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED,
                )

    def check_buffer_times(self, data, reservation_unit):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))

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

    def check_reservation_start_time(self, begin, scheduler):
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

    def check_reservation_kind(self, reservation_unit):
        if reservation_unit.reservation_kind == ReservationKind.SEASON:
            raise ValidationErrorWithCode(
                "Reservation cannot be done to this reservation unit from the api "
                "since its reservation kind is SEASON.",
                ValidationErrorCodes.RESERVATION_UNIT_TYPE_IS_SEASON,
            )

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
        reservation_units: List[ReservationUnit],
    ) -> PriceCalculationResult:
        price_unit_to_minutes = {
            PriceUnit.PRICE_UNIT_PER_15_MINS: 15,
            PriceUnit.PRICE_UNIT_PER_30_MINS: 30,
            PriceUnit.PRICE_UNIT_PER_HOUR: 60,
            PriceUnit.PRICE_UNIT_PER_HALF_DAY: 720,
            PriceUnit.PRICE_UNIT_PER_DAY: 1440,
            PriceUnit.PRICE_UNIT_PER_WEEK: 10080,
        }

        total_reservation_price: Decimal = Decimal("0")
        total_reservation_price_net: Decimal = Decimal("0")

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

            # Time-based calculation is needed only if price unit is not fixed.
            # Otherwise, we can just use the price defined in the reservation unit
            if pricing.price_unit != PriceUnit.PRICE_UNIT_FIXED:
                reservation_duration_in_minutes = (end - begin).seconds / Decimal("60")
                reservation_unit_price_unit_minutes = price_unit_to_minutes.get(
                    pricing.price_unit
                )
                reservation_unit_price_net = Decimal(
                    math.ceil(
                        reservation_duration_in_minutes
                        / reservation_unit_price_unit_minutes
                    )
                    * reservation_unit_price_net
                )

                reservation_unit_price = reservation_unit_price_net * (
                    1 + pricing.tax_percentage.decimal
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

        non_subsidised_price = total_reservation_price
        non_subsidised_price_net = total_reservation_price_net

        return PriceCalculationResult(
            total_reservation_price,
            total_reservation_price_net,
            first_paid_unit_price,
            first_paid_unit_tax_percentage,
            non_subsidised_price,
            non_subsidised_price_net,
        )

    def check_staff_event(
        self, user, reservation_unit_ids: List[int], staff_event: Optional[bool]
    ):
        if staff_event is None or can_handle_reservation_with_units(
            user, reservation_unit_ids
        ):
            return

        raise ValidationErrorWithCode(
            "You don't have permissions to set staff_event",
            ValidationErrorCodes.NO_PERMISSION,
        )

    def check_reservation_type(
        self, user, reservation_unit_ids: List[int], reservation_type: Optional[str]
    ):
        if reservation_type is None or can_handle_reservation_with_units(
            user, reservation_unit_ids
        ):
            return

        raise serializers.ValidationError("You don't have permissions to set type")


class ReservationUpdateSerializer(
    PrimaryKeyUpdateSerializer, ReservationCreateSerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = False
        self.fields["state"].required = False
        self.fields["state"].help_text = (
            "String value for ReservationType's ReservationState enum. "
            + f"Possible values are {', '.join(value[0].upper() for value in STATE_CHOICES.STATE_CHOICES)}."
        )
        self.fields["reservee_first_name"].required = False
        self.fields["reservee_last_name"].required = False
        self.fields["reservee_phone"].required = False
        self.fields["reservee_language"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["priority"].required = False
        self.fields["begin"].required = False
        self.fields["end"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False
        self.fields["purpose_pk"].required = False

    def validate(self, data):
        if self.instance.state not in (STATE_CHOICES.CREATED,):
            raise ValidationErrorWithCode(
                "Reservation cannot be changed anymore.",
                ValidationErrorCodes.CHANGES_NOT_ALLOWED,
            )

        new_state = data.get("state", self.instance.state)
        if new_state not in [STATE_CHOICES.CANCELLED, STATE_CHOICES.CREATED]:
            raise ValidationErrorWithCode(
                f"Setting the reservation state to {new_state} is not allowed.",
                ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED,
            )

        data = super().validate(data)
        data["state"] = new_state

        reservation_units = data.get(
            "reservation_unit", getattr(self.instance, "reservation_unit", None)
        )
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()

        for reservation_unit in reservation_units:
            self.check_metadata_fields(data, reservation_unit)

        # If the reservation as applying_for_free_of_charge True then we require free_of_charge_reason.
        if data.get(
            "applying_for_free_of_charge", self.instance.applying_for_free_of_charge
        ) and not data.get(
            "free_of_charge_reason", self.instance.free_of_charge_reason
        ):
            raise ValidationErrorWithCode(
                "Free of charge reason is mandatory when applying for free of charge.",
                ValidationErrorCodes.REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE,
            )

        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["user"] = self.instance.user  # Do not change the user.
        validated_data["confirmed_at"] = datetime.datetime.now().astimezone(
            get_default_timezone()
        )
        return validated_data

    def check_metadata_fields(self, data, reservation_unit) -> None:
        # Even marked in the metadata set to be mandatory, yet these never should be for private person.
        non_mandatory_fields_for_person = [
            "reservee_organisation_name",
            "home_city",
            "reservee_id",
        ]

        metadata_set = reservation_unit.metadata_set
        required_fields = metadata_set.required_fields.all() if metadata_set else []

        reservee_type = data.get(
            "reservee_type", getattr(self.instance, "reservee_type", None)
        )
        if required_fields and reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL:
            required_fields = metadata_set.required_fields.exclude(
                field_name__in=non_mandatory_fields_for_person
            )

        for required_field in required_fields:
            internal_field_name = required_field.field_name
            existing_value = getattr(self.instance, internal_field_name, None)

            # If the reservee_is_unregistered_association is True it's not mandatory to give reservee_id
            # even if in metadataset says so.
            unregistered_field_name = "reservee_is_unregistered_association"
            if internal_field_name == "reservee_id" and data.get(
                unregistered_field_name,
                getattr(self.instance, unregistered_field_name, None),
            ):
                continue

            if not data.get(internal_field_name, existing_value):
                raise ValidationErrorWithCode(
                    f"Value for required field {to_camel_case(internal_field_name)} is missing.",
                    ValidationErrorCodes.REQUIRED_FIELD_MISSING,
                    to_camel_case(internal_field_name),
                )


class ReservationConfirmSerializer(ReservationUpdateSerializer):
    payment_type = ChoiceCharField(
        choices=PaymentType.choices,
        required=False,
        help_text=(
            "Type of the payment. "
            f"Possible values are {', '.join(value[0].upper() for value in PaymentType.choices)}."
        ),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # All fields should be read-only, except for the lookup
        # field (PK) which should be included in the input
        for field in self.fields:
            self.fields[field].read_only = True
        self.fields["pk"].read_only = False
        self.fields["payment_type"].read_only = False

    class Meta(ReservationUpdateSerializer.Meta):
        fields = ["payment_type"] + ReservationUpdateSerializer.Meta.fields

    def _requires_handling(self):
        return (
            self.instance.reservation_unit.filter(
                require_reservation_handling=True
            ).exists()
            or self.instance.applying_for_free_of_charge
        )

    def _get_default_payment_type(self):
        reservation_unit = self.instance.reservation_unit.first()
        payment_types = reservation_unit.payment_types

        if payment_types.count() == 0:
            raise ValidationErrorWithCode(
                "Reservation unit does not have payment types defined. At least one payment type must be defined.",
                ValidationErrorCodes.INVALID_PAYMENT_TYPE,
            )

        # Rules to pick the default, defined in TILA-1974:
        # 1. If only one payment type is defined, use that
        # 2. If only INVOICE and ON_SITE are defined, use INVOICE
        # 3. Otherwise use ONLINE

        if payment_types.count() == 1:
            return payment_types.first().code
        elif (
            payment_types.filter(
                code__in=[PaymentType.INVOICE, PaymentType.ON_SITE]
            ).count()
            == payment_types.count()
        ):
            return PaymentType.INVOICE
        else:
            return PaymentType.ONLINE

    def validate(self, data):
        data = super().validate(data)

        if self.instance.reservation_unit.count() > 1:
            raise ValidationErrorWithCode(
                "Reservations with multiple reservation units are not supported.",
                ValidationErrorCodes.MULTIPLE_RESERVATION_UNITS,
            )

        if not self._requires_handling():
            payment_type = data.get("payment_type", "").upper()
            reservation_unit = self.instance.reservation_unit.first()

            if not reservation_unit.payment_product:
                raise ValidationErrorWithCode(
                    "Reservation unit is missing payment product",
                    ValidationErrorCodes.MISSING_PAYMENT_PRODUCT,
                )

            if not payment_type:
                data["payment_type"] = self._get_default_payment_type()
            elif not reservation_unit.payment_types.filter(code=payment_type).exists():
                allowed_values = list(
                    map(lambda x: x.code, reservation_unit.payment_types.all())
                )
                raise ValidationErrorWithCode(
                    f"Reservation unit does not support {payment_type} payment type. "
                    f"Allowed values: {', '.join(allowed_values)}",
                    ValidationErrorCodes.INVALID_PAYMENT_TYPE,
                )
        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data

        if self._requires_handling():
            validated_data["state"] = STATE_CHOICES.REQUIRES_HANDLING
        else:
            validated_data["state"] = STATE_CHOICES.CONFIRMED

        return validated_data

    def save(self, **kwargs):
        self.fields.pop("payment_type")
        state = self.validated_data["state"]
        if state == STATE_CHOICES.CONFIRMED:
            payment_type = self.validated_data["payment_type"].upper()
            price_net = round_decimal(self.instance.price_net, 2)
            price_vat = round_decimal(
                self.instance.price_net * (self.instance.tax_percentage_value / 100), 2
            )
            price_total = round_decimal(self.instance.price, 2)

            if payment_type == PaymentType.ON_SITE:
                PaymentOrder.objects.create(
                    payment_type=payment_type,
                    status=PaymentStatus.PAID_MANUALLY,
                    language=self.instance.reservee_language or Language.FI,
                    price_net=price_net,
                    price_vat=price_vat,
                    price_total=price_total,
                    reservation=self.instance,
                )
            else:
                payment_order = create_verkkokauppa_order(self.instance)
                PaymentOrder.objects.create(
                    payment_type=payment_type,
                    status=PaymentStatus.DRAFT,
                    language=self.instance.reservee_language or Language.FI,
                    price_net=price_net,
                    price_vat=price_vat,
                    price_total=price_total,
                    reservation=self.instance,
                    reservation_user_uuid=self.instance.user.uuid,
                    order_id=payment_order.order_id,
                    checkout_url=payment_order.checkout_url,
                    receipt_url=payment_order.receipt_url,
                )

        instance = super().save(**kwargs)

        if instance.state in RESERVATION_STATE_EMAIL_TYPE_MAP.keys():
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP[instance.state]
            )

        if instance.state == STATE_CHOICES.REQUIRES_HANDLING:
            send_staff_reservation_email_task.delay(
                instance.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
                [
                    ReservationNotification.ALL,
                    ReservationNotification.ONLY_HANDLING_REQUIRED,
                ],
            )
        elif instance.state == STATE_CHOICES.CONFIRMED:
            send_staff_reservation_email_task.delay(
                instance.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
                [ReservationNotification.ALL],
            )

        return instance


class ReservationCancellationSerializer(PrimaryKeyUpdateSerializer):
    cancel_reason_pk = IntegerPrimaryKeyField(
        queryset=ReservationCancelReason.objects.all(),
        source="cancel_reason",
        required=True,
        help_text="Primary key for the pre-defined cancel reason.",
    )
    cancel_details = serializers.CharField(
        help_text="Additional information for the cancellation.",
        required=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "cancel_reason_pk",
            "cancel_details",
            "state",
        ]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.CANCELLED
        return validated_data

    def validate(self, data):
        data = super().validate(data)
        if self.instance.state != STATE_CHOICES.CONFIRMED:
            raise ValidationErrorWithCode(
                "Only reservations in confirmed state can be cancelled through this.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )

        now = datetime.datetime.now(tz=get_default_timezone())
        if self.instance.begin < now:
            ValidationErrorWithCode(
                "Reservation cannot be cancelled when begin time is in past.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )
        for reservation_unit in self.instance.reservation_unit.all():
            cancel_rule = reservation_unit.cancellation_rule
            if not cancel_rule:
                raise ValidationErrorWithCode(
                    "Reservation cannot be cancelled thus no cancellation rule.",
                    ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
                )
            must_be_cancelled_before = (
                self.instance.begin - cancel_rule.can_be_cancelled_time_before
            )
            if must_be_cancelled_before < now:
                raise ValidationErrorWithCode(
                    "Reservation cannot be cancelled because the cancellation period has expired.",
                    ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
                )
            if cancel_rule.needs_handling:
                raise ValidationErrorWithCode(
                    "Reservation cancellation needs manual handling.",
                    ValidationErrorCodes.REQUIRES_MANUAL_HANDLING,
                )

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state in RESERVATION_STATE_EMAIL_TYPE_MAP.keys():
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP[instance.state]
            )
        return instance


class ReservationDenySerializer(PrimaryKeySerializer):
    deny_reason_pk = IntegerPrimaryKeyField(
        queryset=ReservationDenyReason.objects.all(),
        source="deny_reason",
        required=True,
        help_text="Primary key for the pre-defined deny reason.",
    )

    handling_details = serializers.CharField(
        help_text="Additional information for denying.",
        required=False,
        allow_blank=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["handled_at"].read_only = True

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
            "handling_details",
            "handled_at",
            "deny_reason_pk",
        ]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.DENIED
        validated_data["handled_at"] = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        # For now we wan't to copy the handling details to working memo. In future perhaps not.
        validated_data["working_memo"] = validated_data["handling_details"]
        return validated_data

    def validate(self, data):
        if self.instance.state != STATE_CHOICES.REQUIRES_HANDLING:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be denied.",
                ValidationErrorCodes.DENYING_NOT_ALLOWED,
            )
        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state in RESERVATION_STATE_EMAIL_TYPE_MAP.keys():
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP[instance.state]
            )
        return instance


class ReservationApproveSerializer(PrimaryKeySerializer):
    handling_details = serializers.CharField(
        help_text="Additional information for approval.",
        required=False,
        allow_blank=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["handled_at"].read_only = True
        self.fields["price"].required = True

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
            "handling_details",
            "handled_at",
            "price",
        ]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.CONFIRMED
        validated_data["handled_at"] = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        # For now we wan't to copy the handling details to working memo. In future perhaps not.
        validated_data["working_memo"] = validated_data["handling_details"]
        return validated_data

    def validate(self, data):
        if self.instance.state != STATE_CHOICES.REQUIRES_HANDLING:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be approved.",
                ValidationErrorCodes.APPROVING_NOT_ALLOWED,
            )
        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state == STATE_CHOICES.CONFIRMED:
            if instance.price > 0:
                send_reservation_email_task.delay(
                    instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP["NEEDS_PAYMENT"]
                )
            else:
                send_reservation_email_task.delay(
                    instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP["APPROVED"]
                )

        if instance.state == STATE_CHOICES.CONFIRMED:
            send_staff_reservation_email_task.delay(
                instance.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
                [ReservationNotification.ALL],
            )

        return instance


class ReservationRequiresHandlingSerializer(PrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.REQUIRES_HANDLING
        return validated_data

    def validate(self, data):
        if self.instance.state not in (STATE_CHOICES.DENIED, STATE_CHOICES.CONFIRMED):
            raise ValidationErrorWithCode(
                f"Only reservations with states {STATE_CHOICES.DENIED.upper()} and {STATE_CHOICES.CONFIRMED.upper()} "
                f"can be reverted to requires handling.",
                ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED,
            )
        data = super().validate(data)
        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state in RESERVATION_STATE_EMAIL_TYPE_MAP.keys():
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP[instance.state]
            )

        if instance.state == STATE_CHOICES.REQUIRES_HANDLING:
            send_staff_reservation_email_task.delay(
                instance.id,
                EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
                [
                    ReservationNotification.ALL,
                    ReservationNotification.ONLY_HANDLING_REQUIRED,
                ],
            )

        return instance


class ReservationWorkingMemoSerializer(PrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
