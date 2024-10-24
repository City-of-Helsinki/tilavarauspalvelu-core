import datetime
from typing import Any

from django.utils.timezone import get_default_timezone
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework import serializers

from tilavarauspalvelu.api.graphql.extensions.fields import DurationField
from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationSchedulingMixin
from tilavarauspalvelu.enums import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.models import AgeGroup, City, Reservation, ReservationPurpose, ReservationUnit

DEFAULT_TIMEZONE = get_default_timezone()


class StaffReservationModifySerializer(OldPrimaryKeyUpdateSerializer, ReservationSchedulingMixin):
    instance: Reservation

    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_units",
    )
    age_group_pk = IntegerPrimaryKeyField(queryset=AgeGroup.objects.all(), source="age_group", allow_null=True)
    home_city_pk = IntegerPrimaryKeyField(queryset=City.objects.all(), source="home_city", allow_null=True)
    purpose_pk = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True)

    buffer_time_before = DurationField(required=False, read_only=True)
    buffer_time_after = DurationField(required=False, read_only=True)

    reservee_type = EnumFriendlyChoiceField(choices=CustomerTypeChoice.choices, enum=CustomerTypeChoice)
    state = EnumFriendlyChoiceField(choices=ReservationStateChoice.choices, enum=ReservationStateChoice)
    type = EnumFriendlyChoiceField(required=False, choices=ReservationTypeChoice.choices, enum=ReservationTypeChoice)
    reservee_language = serializers.ChoiceField(choices=RESERVEE_LANGUAGE_CHOICES, required=False, default="")

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
            "type",
        ]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.fields["reservation_unit_pks"].write_only = True

        self.fields["confirmed_at"].read_only = True
        self.fields["unit_price"].read_only = True
        self.fields["tax_percentage_value"].read_only = True
        self.fields["price"].read_only = True
        self.fields["price_net"].read_only = True
        self.fields["non_subsidised_price"].read_only = True
        self.fields["non_subsidised_price_net"].read_only = True
        self.fields["begin"].read_only = True
        self.fields["end"].read_only = True
        self.fields["buffer_time_before"].read_only = True
        self.fields["buffer_time_after"].read_only = True

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
        self.fields["state"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        data = super().validate(data)

        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            raise ValidationErrorWithCode(
                "Reservation must be in confirmed state.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        self.check_time_passed()
        if data.get("type"):
            self.check_type(data.get("type"))

        return data

    def check_type(self, type_: str) -> None:
        if self.instance.type == ReservationTypeChoice.NORMAL.value and type_ != ReservationTypeChoice.NORMAL.value:
            raise ValidationErrorWithCode(
                f"Reservation type cannot be changed from NORMAL to {type_.upper()}.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        if type_ == ReservationTypeChoice.NORMAL.value and self.instance.type != ReservationTypeChoice.NORMAL.value:
            raise ValidationErrorWithCode(
                f"Reservation type cannot be changed to NORMAl from state {self.instance.type.upper()}.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

    def check_time_passed(self) -> None:
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        if now.hour <= 1:
            now -= datetime.timedelta(days=1)

        if self.instance.end.date() < now.date():
            raise ValidationErrorWithCode(
                "Reservation cannot be changed anymore.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )
