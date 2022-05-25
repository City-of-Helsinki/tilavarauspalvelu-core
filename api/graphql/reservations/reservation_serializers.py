import datetime
from typing import List

from django.conf import settings
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
from email_notification.tasks import send_reservation_email_task
from reservation_units.models import ReservationUnit
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import (
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationPurpose,
)

DEFAULT_TIMEZONE = get_default_timezone()

RESERVATION_STATE_EMAIL_TYPE_MAP = {
    STATE_CHOICES.CONFIRMED: EmailType.RESERVATION_CONFIRMED,
    STATE_CHOICES.REQUIRES_HANDLING: EmailType.HANDLING_REQUIRED_RESERVATION,
    STATE_CHOICES.CANCELLED: EmailType.RESERVATION_CANCELLED,
    STATE_CHOICES.DENIED: EmailType.RESERVATION_REJECTED,
    "APPROVED": EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
}


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
    buffer_time_before = DurationField(required=False)
    buffer_time_after = DurationField(required=False)

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
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["reservation_unit_pks"].write_only = True
        self.fields["confirmed_at"].read_only = True
        self.fields["unit_price"].read_only = True
        self.fields["tax_percentage_value"].read_only = True
        self.fields["price"].read_only = True

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

    def validate_reservee_type(self, value):
        valid_values = [x[0] for x in CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES]
        if value not in valid_values:
            raise serializers.ValidationError(
                f"Invalid reservee type {value}. Valid values are {', '.join(valid_values)}"
            )
        return value

    def validate_reservation(self, reservation_unit, scheduler, begin, end):
        if reservation_unit.allow_reservations_without_opening_hours:
            return

        if (
            reservation_unit.reservation_begins
            and begin < reservation_unit.reservation_begins
        ) or (
            reservation_unit.reservation_ends
            and end > reservation_unit.reservation_ends
        ):
            raise serializers.ValidationError(
                "Reservation unit is not reservable within this reservation time."
            )
        if reservation_unit.check_reservation_overlap(begin, end, self.instance):
            raise serializers.ValidationError(
                "Overlapping reservations are not allowed."
            )

        is_reservation_unit_open = scheduler.is_reservation_unit_open(begin, end)
        if not is_reservation_unit_open:
            raise serializers.ValidationError(
                "Reservation unit is not open within desired reservation time."
            )

    def validate(self, data):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))
        begin = begin.astimezone(DEFAULT_TIMEZONE)
        end = end.astimezone(DEFAULT_TIMEZONE)

        duration = end - begin
        reservation_units: List[ReservationUnit] = data.get(
            "reservation_unit", getattr(self.instance, "reservation_unit", None)
        )
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()

        sku = None
        for reservation_unit in reservation_units:
            scheduler = ReservationUnitReservationScheduler(
                reservation_unit, opening_hours_end=end.date()
            )
            self.validate_reservation(reservation_unit, scheduler, begin, end)
            open_app_round = scheduler.get_conflicting_open_application_round(
                begin.date(), end.date()
            )

            if open_app_round:
                raise serializers.ValidationError(
                    "One or more reservation units are in open application round."
                )
            if (
                reservation_unit.max_reservation_duration
                and duration.total_seconds()
                > reservation_unit.max_reservation_duration.total_seconds()
            ):
                raise serializers.ValidationError(
                    "Reservation duration exceeds one or more reservation unit's maximum duration."
                )
            if (
                reservation_unit.min_reservation_duration
                and duration.total_seconds()
                < reservation_unit.min_reservation_duration.total_seconds()
            ):
                raise serializers.ValidationError(
                    "Reservation duration less than one or more reservation unit's minimum duration."
                )

            self.check_buffer_times(data, reservation_unit)
            self.check_reservation_start_time(begin, scheduler)
            self.check_max_reservations_per_user(
                self.context.get("request").user, reservation_unit
            )
            self.check_sku(sku, reservation_unit.sku)
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
        if settings.TMP_PERMISSIONS_DISABLED and user.is_anonymous:
            user = None

        data["user"] = user

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
            raise serializers.ValidationError(
                "An ambiguous SKU cannot be assigned for this reservation."
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
                raise serializers.ValidationError(
                    "Maximum number of active reservations for this reservation unit exceeded."
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
            raise serializers.ValidationError(
                "Reservation overlaps with reservation before due to buffer time."
            )

        if (
            reservation_after
            and buffer_after
            and (reservation_after.begin - buffer_after) < end
        ):
            raise serializers.ValidationError(
                "Reservation overlaps with reservation after due to buffer time."
            )

    def check_reservation_start_time(self, begin, scheduler):
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
            raise serializers.ValidationError(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            )


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
            raise serializers.ValidationError("Reservation cannot be changed anymore.")

        new_state = data.get("state", self.instance.state)
        if new_state not in [STATE_CHOICES.CANCELLED, STATE_CHOICES.CREATED]:
            raise serializers.ValidationError(
                f"Setting the reservation state to {new_state} is not allowed."
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
        metadata_set = reservation_unit.metadata_set
        required_fields = metadata_set.required_fields.all() if metadata_set else []
        for required_field in required_fields:
            internal_field_name = required_field.field_name
            existing_value = getattr(self.instance, internal_field_name, None)
            if not data.get(internal_field_name, existing_value):
                raise serializers.ValidationError(
                    f"Value for required field {to_camel_case(internal_field_name)} is missing."
                )


class ReservationConfirmSerializer(ReservationUpdateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # All fields should be read-only, except for the lookup
        # field (PK) which should be included in the input
        for field in self.fields:
            self.fields[field].read_only = True
        self.fields["pk"].read_only = False

    @property
    def validated_data(self):
        validated_data = super().validated_data

        if self.instance.reservation_unit.filter(
            require_reservation_handling=True
        ).exists():
            validated_data["state"] = STATE_CHOICES.REQUIRES_HANDLING
        else:
            validated_data["state"] = STATE_CHOICES.CONFIRMED
        return validated_data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state in RESERVATION_STATE_EMAIL_TYPE_MAP.keys():
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP[instance.state]
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
            raise serializers.ValidationError(
                "Only reservations in confirmed state can be cancelled through this."
            )

        now = datetime.datetime.now(tz=get_default_timezone())
        if self.instance.begin < now:
            raise serializers.ValidationError(
                "Reservation cannot be cancelled when begin time is in past."
            )
        for reservation_unit in self.instance.reservation_unit.all():
            cancel_rule = reservation_unit.cancellation_rule
            if not cancel_rule:
                raise serializers.ValidationError(
                    "Reservation cannot be cancelled thus no cancellation rule."
                )
            must_be_cancelled_before = (
                self.instance.begin - cancel_rule.can_be_cancelled_time_before
            )
            if must_be_cancelled_before < now:
                raise serializers.ValidationError(
                    "Reservation cannot be cancelled because the cancellation period has expired."
                )
            if cancel_rule.needs_handling:
                raise serializers.ValidationError(
                    "Reservation cancellation needs manual handling."
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
            raise serializers.ValidationError(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be denied."
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
            raise serializers.ValidationError(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be approved."
            )
        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        if instance.state == STATE_CHOICES.CONFIRMED:
            send_reservation_email_task.delay(
                instance.id, RESERVATION_STATE_EMAIL_TYPE_MAP["APPROVED"]
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
            raise serializers.ValidationError(
                f"Only reservations with states {STATE_CHOICES.DENIED.upper()} and {STATE_CHOICES.CONFIRMED.upper()} "
                f"can be reverted to requires handling."
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


class ReservationWorkingMemoSerializer(PrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
