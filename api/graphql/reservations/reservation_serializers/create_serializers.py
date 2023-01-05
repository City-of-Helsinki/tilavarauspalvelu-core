import datetime
from typing import List, Optional

from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.choice_char_field import ChoiceCharField
from api.graphql.duration_field import DurationField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.reservations.reservation_serializers.mixins import (
    ReservationPriceMixin,
    ReservationSchedulingMixin,
)
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from applications.models import CUSTOMER_TYPES, City
from permissions.helpers import can_handle_reservation_with_units
from reservation_units.models import ReservationKind, ReservationUnit
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import (
    RESERVEE_LANGUAGE_CHOICES,
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationPurpose,
    ReservationType,
)

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationCreateSerializer(
    PrimaryKeySerializer, ReservationPriceMixin, ReservationSchedulingMixin
):
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
            self.check_reservation_time(reservation_unit)
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_reservation_duration(reservation_unit, begin, end)
            self.check_buffer_times(reservation_unit, begin, end)
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
            self.check_reservation_start_time(scheduler, begin)

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

        reservation_type = data.get("type", None)
        reservation_unit_ids = list(map(lambda x: x.pk, reservation_units))
        self.check_reservation_type(user, reservation_unit_ids, reservation_type)

        return data

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

    def check_reservation_kind(self, reservation_unit):
        if reservation_unit.reservation_kind == ReservationKind.SEASON:
            raise ValidationErrorWithCode(
                "Reservation cannot be done to this reservation unit from the api "
                "since its reservation kind is SEASON.",
                ValidationErrorCodes.RESERVATION_UNIT_TYPE_IS_SEASON,
            )

    def check_reservation_type(
        self, user, reservation_unit_ids: List[int], reservation_type: Optional[str]
    ):
        if reservation_type is None or can_handle_reservation_with_units(
            user, reservation_unit_ids
        ):
            return

        raise serializers.ValidationError("You don't have permissions to set type")
