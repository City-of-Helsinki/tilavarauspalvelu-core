import datetime

from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.choice_fields import ChoiceCharField
from api.graphql.duration_field import DurationField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.reservations.reservation_serializers.mixins import (
    ReservationSchedulingMixin,
)
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from applications.models import CUSTOMER_TYPES, City
from reservation_units.models import ReservationUnit
from reservations.models import RESERVEE_LANGUAGE_CHOICES
from reservations.models import STATE_CHOICES as ReservationState
from reservations.models import (
    AgeGroup,
    Reservation,
    ReservationPurpose,
    ReservationType,
)

DEFAULT_TIMEZONE = get_default_timezone()


class StaffReservationModifySerializer(
    PrimaryKeyUpdateSerializer, ReservationSchedulingMixin
):
    age_group_pk = IntegerPrimaryKeyField(
        queryset=AgeGroup.objects.all(), source="age_group", allow_null=True
    )
    buffer_time_before = DurationField(required=False)
    buffer_time_after = DurationField(required=False)
    home_city_pk = IntegerPrimaryKeyField(
        queryset=City.objects.all(), source="home_city", allow_null=True
    )
    priority = serializers.IntegerField(required=False)
    purpose_pk = IntegerPrimaryKeyField(
        queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True
    )
    reservee_type = ChoiceCharField(
        choices=CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES,
        help_text=(
            "Type of the reservee. "
            f"Possible values are {', '.join(value[0].upper() for value in CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES)}."
        ),
    )
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
    )
    reservee_language = ChoiceCharField(
        choices=RESERVEE_LANGUAGE_CHOICES, required=False, default=""
    )
    state = ChoiceCharField(
        help_text="Read only string value for ReservationType's ReservationState enum.",
        choices=ReservationState.STATE_CHOICES,
    )
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
        self.fields["state"].help_text = (
            "String value for ReservationType's ReservationState enum. "
            + f"Possible values are {', '.join(value[0].upper() for value in ReservationState.STATE_CHOICES)}."
        )
        self.fields["priority"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False

    def validate(self, data):
        data = super().validate(data)

        if self.instance.state != ReservationState.CONFIRMED:
            raise ValidationErrorWithCode(
                "Reservation must be in confirmed state.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        begin = data.get("begin", self.instance.begin)
        end = data.get("end", self.instance.end)

        new_buffer_before = data.get("buffer_time_before", None)
        new_buffer_after = data.get("buffer_time_after", None)

        for reservation_unit in self.instance.reservation_unit.all():
            reservation_type = data.get("type", getattr(self.instance, "type", None))
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_buffer_times(
                reservation_unit,
                begin,
                end,
                reservation_type=reservation_type,
                buffer_before=new_buffer_before,
                buffer_after=new_buffer_after,
            )
            self.check_reservation_intervals_for_staff_reservation(
                reservation_unit, begin
            )

        self.check_time_passed()

        if data.get("type"):
            self.check_type(data.get("type"))

        return data

    def check_type(self, type):
        if (
            self.instance.type == ReservationType.NORMAL
            and type != ReservationType.NORMAL
        ):
            raise ValidationErrorWithCode(
                f"Reservation type cannot be changed from NORMAL to {type.upper()}.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        if (
            type == ReservationType.NORMAL
            and self.instance.type != ReservationType.NORMAL
        ):
            raise ValidationErrorWithCode(
                f"Reservation type cannot be changed to NORMAl from state {self.instance.type.upper()}.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

    def check_time_passed(self):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        if now.hour <= 1:
            now = now - datetime.timedelta(days=1)

        if self.instance.end.date() < now.date():
            raise ValidationErrorWithCode(
                "Reservation cannot be changed anymore.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )
