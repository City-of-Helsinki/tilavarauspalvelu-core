import datetime

from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.choice_char_field import ChoiceCharField
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
    RecurringReservation,
    Reservation,
    ReservationPurpose,
    ReservationType,
)

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationStaffCreateSerializer(
    PrimaryKeySerializer, ReservationSchedulingMixin
):
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
    type = ChoiceCharField(
        required=True,
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
        self.fields["buffer_time_before"].required = False

    def validate(self, data):
        data = super().validate(data)

        begin = data.get("begin").astimezone(DEFAULT_TIMEZONE)
        end = data.get("end").astimezone(DEFAULT_TIMEZONE)

        reservation_units = data.get(
            "reservation_unit",
        )

        self.check_begin(begin, end)

        for reservation_unit in reservation_units:
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_buffer_times(reservation_unit, begin, end)
            self.check_reservation_intervals_for_staff_reservation(
                reservation_unit, begin
            )

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        data["handled_at"] = now
        data["confirmed_at"] = now
        data["state"] = ReservationState.CONFIRMED

        user = self.context.get("request").user
        data["user"] = user

        return data

    def check_begin(self, begin, end):
        if begin > end:
            raise ValidationErrorWithCode(
                "End cannot be before begin",
                ValidationErrorCodes.RESERVATION_BEGIN_AFTER_END,
            )

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        if begin < now:
            raise ValidationErrorWithCode(
                "Reservation new begin cannot be in the past",
                ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST,
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
        ).astimezone(DEFAULT_TIMEZONE)
        end_time = start_time + datetime.timedelta(hours=23, minutes=59, seconds=59)
        while start_time < end_time:
            possible_start_times.add(start_time.time())
            start_time += interval_timedelta

        if begin.time() not in possible_start_times:
            raise ValidationErrorWithCode(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes.",
                ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL,
            )
