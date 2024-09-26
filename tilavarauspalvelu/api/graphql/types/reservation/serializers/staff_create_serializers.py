import datetime
from typing import TYPE_CHECKING

from django.utils.timezone import get_default_timezone
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework import serializers

from common.date_utils import local_datetime
from tilavarauspalvelu.api.graphql.extensions.fields import OldChoiceCharField
from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeySerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationSchedulingMixin
from tilavarauspalvelu.enums import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.models import (
    AgeGroup,
    City,
    RecurringReservation,
    Reservation,
    ReservationPurpose,
    ReservationUnit,
)

if TYPE_CHECKING:
    from common.typing import AnyUser

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationStaffCreateSerializer(OldPrimaryKeySerializer, ReservationSchedulingMixin):
    recurring_reservation_pk = IntegerPrimaryKeyField(
        queryset=RecurringReservation.objects.all(),
        source="recurring_reservation",
        allow_null=True,
        required=False,
    )
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
        required=True,
    )
    purpose_pk = IntegerPrimaryKeyField(
        queryset=ReservationPurpose.objects.all(),
        source="purpose",
        allow_null=True,
        required=False,
    )
    home_city_pk = IntegerPrimaryKeyField(
        queryset=City.objects.all(),
        source="home_city",
        allow_null=True,
        required=False,
    )
    age_group_pk = IntegerPrimaryKeyField(
        queryset=AgeGroup.objects.all(),
        source="age_group",
        allow_null=True,
        required=False,
    )
    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )
    reservee_type = EnumFriendlyChoiceField(
        choices=CustomerTypeChoice.choices,
        enum=CustomerTypeChoice,
        required=False,
    )
    type = EnumFriendlyChoiceField(
        choices=ReservationTypeChoice.choices,
        enum=ReservationTypeChoice,
        required=True,
    )
    reservee_language = OldChoiceCharField(
        choices=RESERVEE_LANGUAGE_CHOICES,
        default="",
        required=False,
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
        extra_kwargs = {
            "applying_for_free_of_charge": {"required": False},
            "begin": {"required": True},
            "billing_address_city": {"required": False},
            "billing_address_street": {"required": False},
            "billing_address_zip": {"required": False},
            "billing_email": {"required": False},
            "billing_first_name": {"required": False},
            "billing_last_name": {"required": False},
            "billing_phone": {"required": False},
            "buffer_time_before": {
                "required": False,
                "help_text": (
                    "Can be a number of seconds or timespan in format HH:MM:SS. "
                    "Null/undefined value means buffer from reservation unit is used."
                ),
            },
            "buffer_time_after": {
                "required": False,
                "help_text": (
                    "Can be a number of seconds or timespan in format HH:MM:SS. "
                    "Null/undefined value means buffer from reservation unit is used."
                ),
            },
            "confirmed_at": {"read_only": True},
            "description": {"required": False},
            "end": {"required": True},
            "free_of_charge_reason": {"required": False},
            "handled_at": {"read_only": True},
            "name": {"required": False},
            "num_persons": {"required": False},
            "reservee_address_city": {"required": False},
            "reservee_address_street": {"required": False},
            "reservee_address_zip": {"required": False},
            "reservee_email": {"required": False},
            "reservee_first_name": {"required": False},
            "reservee_id": {"required": False},
            "reservee_is_unregistered_association": {"required": False},
            "reservee_last_name": {"required": False},
            "reservee_organisation_name": {"required": False},
            "reservee_phone": {"required": False},
        }

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

        request_user: AnyUser = self.context["request"].user
        data["user"] = request_user
        data["reservee_used_ad_login"] = (
            False if request_user.is_anonymous else getattr(request_user.id_token, "is_ad_login", False)
        )

        return data

    def validate_type(self, reservation_type):
        allowed_types = [
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.BEHALF.value,
            ReservationTypeChoice.SEASONAL.value,
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
