import datetime

from django.utils.timezone import get_default_timezone
from graphene_django_extensions.fields import IntegerPrimaryKeyField
from rest_framework import serializers

from api.graphql.extensions.fields import OldChoiceCharField
from api.graphql.extensions.serializers import OldPrimaryKeySerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from api.graphql.types.reservation.serializers.mixins import ReservationSchedulingMixin
from applications.models import City
from common.date_utils import local_datetime
from reservation_units.models import ReservationUnit
from reservations.choices import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.models import AgeGroup, RecurringReservation, Reservation, ReservationPurpose

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationStaffCreateSerializer(OldPrimaryKeySerializer, ReservationSchedulingMixin):
    recurring_reservation_pk = IntegerPrimaryKeyField(
        queryset=RecurringReservation.objects.all(),
        source="recurring_reservation",
        required=False,
        allow_null=True,
    )
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
        required=True,
    )
    purpose_pk = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True)
    home_city_pk = IntegerPrimaryKeyField(queryset=City.objects.all(), source="home_city", allow_null=True)
    age_group_pk = IntegerPrimaryKeyField(queryset=AgeGroup.objects.all(), source="age_group", allow_null=True)
    reservee_type = OldChoiceCharField(choices=CustomerTypeChoice.choices)
    reservee_language = OldChoiceCharField(choices=RESERVEE_LANGUAGE_CHOICES, required=False, default="")
    type = OldChoiceCharField(required=True, choices=ReservationTypeChoice.choices)

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
            "billing_first_name",
            "billing_last_name",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            "billing_phone",
            "billing_email",
            "home_city_pk",
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            "age_group_pk",
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
            "handled_at",
            "unit_price",
            "type",
            "working_memo",
            "recurring_reservation_pk",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["state"].read_only = True
        self.fields["confirmed_at"].read_only = True
        self.fields["handled_at"].read_only = True
        self.fields["begin"].required = True
        self.fields["end"].required = True

        # Optional fields
        self.fields["billing_first_name"].required = False
        self.fields["billing_last_name"].required = False
        self.fields["billing_phone"].required = False
        self.fields["billing_email"].required = False
        self.fields["billing_address_street"].required = False
        self.fields["billing_address_city"].required = False
        self.fields["billing_address_zip"].required = False
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
        self.fields["home_city_pk"].required = False
        self.fields["age_group_pk"].required = False
        self.fields["applying_for_free_of_charge"].required = False
        self.fields["free_of_charge_reason"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["num_persons"].required = False
        self.fields["purpose_pk"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["buffer_time_after"].help_text = (
            "Can be a number of seconds or timespan in format HH:MM:SS. "
            "Null/undefined value means buffer from reservation unit is used."
        )
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_before"].help_text = (
            "Can be a number of seconds or timespan in format HH:MM:SS. "
            "Null/undefined value means buffer from reservation unit is used."
        )

    def validate(self, data):
        data = super().validate(data)

        begin = data.get("begin").astimezone(DEFAULT_TIMEZONE)
        end = data.get("end").astimezone(DEFAULT_TIMEZONE)

        reservation_units: list[ReservationUnit] = data.get("reservation_unit")

        self.check_begin(begin, end)

        buffer_before: datetime.timedelta | None = data.get("buffer_time_before", None)
        buffer_after: datetime.timedelta | None = data.get("buffer_time_after", None)

        for reservation_unit in reservation_units:
            if reservation_unit.reservation_block_whole_day:
                data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
                data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)

            reservation_type = data.get("type", getattr(self.instance, "type", None))
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_buffer_times(
                reservation_unit,
                begin,
                end,
                reservation_type=reservation_type,
                new_buffer_before=buffer_before,
                new_buffer_after=buffer_after,
            )
            self.check_reservation_intervals_for_staff_reservation(reservation_unit, begin)

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        data["handled_at"] = now
        data["confirmed_at"] = now
        data["state"] = ReservationStateChoice.CONFIRMED.value

        user = self.context.get("request").user
        data["user"] = user

        return data

    def validate_type(self, reservation_type):
        allowed_types = [
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.BEHALF.value,
        ]

        if reservation_type not in allowed_types:
            raise ValidationErrorWithCode(
                f"Reservation type {reservation_type} is not allowed in this mutation. "
                f"Allowed choices are {', '.join(allowed_types)}.",
                ValidationErrorCodes.RESERVATION_TYPE_NOT_ALLOWED,
            )

        return reservation_type

    def check_begin(self, begin: datetime.datetime, end: datetime.datetime) -> None:
        if begin > end:
            raise ValidationErrorWithCode(
                "End cannot be before begin",
                ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END,
            )

        now = local_datetime()
        min_allowed_date = now.date()

        # For the first hour of the day, we allow reservations to be created for the previous day
        if now.hour == 0:
            min_allowed_date -= datetime.timedelta(days=1)

        if begin.astimezone(DEFAULT_TIMEZONE).date() < min_allowed_date:
            raise ValidationErrorWithCode(
                "Reservation begin date cannot be in the past.",
                ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST,
            )
