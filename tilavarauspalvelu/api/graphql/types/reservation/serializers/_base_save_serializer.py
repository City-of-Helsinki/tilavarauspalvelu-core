from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework import serializers

from tilavarauspalvelu.api.graphql.extensions.fields import DurationField, OldChoiceCharField
from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeySerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import (
    ReservationPriceMixin,
    ReservationSchedulingMixin,
)
from tilavarauspalvelu.enums import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationKind,
    ReservationStateChoice,
)
from tilavarauspalvelu.models import AgeGroup, City, Reservation, ReservationPurpose, ReservationUnit
from utils.date_utils import DEFAULT_TIMEZONE

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import AnyUser


class ReservationBaseSaveSerializer(OldPrimaryKeySerializer, ReservationPriceMixin, ReservationSchedulingMixin):
    instance: Reservation

    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_units",
    )
    purpose_pk = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True)
    home_city_pk = IntegerPrimaryKeyField(queryset=City.objects.all(), source="home_city", allow_null=True)
    age_group_pk = IntegerPrimaryKeyField(queryset=AgeGroup.objects.all(), source="age_group", allow_null=True)

    buffer_time_before = DurationField(required=False)
    buffer_time_after = DurationField(required=False)

    state = EnumFriendlyChoiceField(choices=ReservationStateChoice.choices, enum=ReservationStateChoice)
    reservee_type = EnumFriendlyChoiceField(choices=CustomerTypeChoice.choices, enum=CustomerTypeChoice)
    reservee_language = OldChoiceCharField(choices=RESERVEE_LANGUAGE_CHOICES, default="", required=False)

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
        ]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
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

    def _get_reservation_units(self, data: dict[str, Any]) -> list[ReservationUnit]:
        reservation_units = data.get("reservation_units", getattr(self.instance, "reservation_units", None))
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()
        return reservation_units

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin: datetime.datetime = data.get("begin", getattr(self.instance, "begin", None))
        end: datetime.datetime = data.get("end", getattr(self.instance, "end", None))
        begin = begin.astimezone(DEFAULT_TIMEZONE)
        end = end.astimezone(DEFAULT_TIMEZONE)

        request_user: AnyUser = self.context["request"].user
        reservation_units = self._get_reservation_units(data)

        sku = None
        for reservation_unit in reservation_units:
            self.check_if_reservee_should_be_adult(reservation_unit, request_user)
            self.check_reservation_time(reservation_unit)
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_reservation_duration(reservation_unit, begin, end)
            self.check_buffer_times(reservation_unit, begin, end)
            self.check_reservation_days_before(begin, reservation_unit)
            self.check_max_reservations_per_user(self.context.get("request").user, reservation_unit)
            self.check_sku(sku, reservation_unit.sku)
            self.check_reservation_kind(reservation_unit)
            self.check_opening_hours(reservation_unit, begin, end)
            self.check_open_application_round(reservation_unit, begin, end)
            self.check_reservation_start_time(reservation_unit, begin)

            sku = reservation_unit.sku

        data["sku"] = sku
        data["state"] = ReservationStateChoice.CREATED.value
        data["buffer_time_before"], data["buffer_time_after"] = self._calculate_buffers(begin, end, reservation_units)

        data["user"] = None if request_user.is_anonymous else request_user
        data["reservee_used_ad_login"] = (
            False if request_user.is_anonymous else getattr(request_user.id_token, "is_ad_login", False)
        )

        if self.requires_price_calculation(data):
            price_calculation_result = self.calculate_price(begin, end, reservation_units)
            data["price"] = price_calculation_result.reservation_price
            data["unit_price"] = price_calculation_result.unit_price
            data["tax_percentage_value"] = price_calculation_result.tax_percentage_value
            data["non_subsidised_price"] = price_calculation_result.non_subsidised_price

        return data

    @staticmethod
    def _calculate_buffers(
        begin: datetime.datetime,
        end: datetime.datetime,
        reservation_units: list[ReservationUnit],
    ) -> tuple[datetime.timedelta, datetime.timedelta]:
        buffer_time_before: datetime.timedelta = datetime.timedelta()
        buffer_time_after: datetime.timedelta = datetime.timedelta()

        for reservation_unit in reservation_units:
            before = reservation_unit.actions.get_actual_before_buffer(begin)
            after = reservation_unit.actions.get_actual_after_buffer(end)

            buffer_time_before = max(before, buffer_time_before)

            buffer_time_after = max(after, buffer_time_after)

        return buffer_time_before, buffer_time_after

    def check_sku(self, current_sku: str, new_sku: str) -> None:
        if current_sku is not None and current_sku != new_sku:
            msg = "An ambiguous SKU cannot be assigned for this reservation."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.AMBIGUOUS_SKU)

    def check_max_reservations_per_user(self, user: AnyUser, reservation_unit: ReservationUnit) -> None:
        if reservation_unit.max_reservations_per_user is None:
            return

        num_active_user_reservations = (
            Reservation.objects.filter_for_user_num_active_reservations(user=user, reservation_unit=reservation_unit)
            .exclude(pk=getattr(self.instance, "pk", None))  # Safely handle both create and update cases
            .count()
        )
        if num_active_user_reservations >= reservation_unit.max_reservations_per_user:
            msg = "Maximum number of active reservations for this reservation unit exceeded."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED)

    def check_reservation_kind(self, reservation_unit: ReservationUnit) -> None:
        if reservation_unit.reservation_kind == ReservationKind.SEASON:
            msg = "Reservation unit is only available or seasonal booking."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_UNIT_TYPE_IS_SEASON)

    def check_if_reservee_should_be_adult(self, reservation_unit: ReservationUnit, user: User) -> None:
        if self.instance is not None:
            # Only check for creation
            return

        if not reservation_unit.require_adult_reservee:
            return

        # AD users are currently never under age since we have blocked students from signing in.
        if user.actions.is_ad_user:
            return

        if user.actions.is_of_age:
            return

        msg = "Reservation unit can only be booked by an adult reservee"
        raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_ADULT_RESERVEE_REQUIRED)
