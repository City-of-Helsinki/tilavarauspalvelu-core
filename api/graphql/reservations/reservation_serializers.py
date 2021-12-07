import datetime

from django.conf import settings
from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from reservation_units.models import ReservationUnit
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import (
    STATE_CHOICES,
    Reservation,
    ReservationCancelReason,
    ReservationPurpose,
)

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationCreateSerializer(PrimaryKeySerializer):
    state = serializers.CharField(
        help_text="Read only string value for ReservationType's ReservationState enum."
    )
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
    )
    priority = serializers.IntegerField(required=False)
    purpose_pk = IntegerPrimaryKeyField(
        queryset=ReservationPurpose.objects.all(), source="purpose", allow_null=True
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_phone",
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
            "price",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["reservation_unit_pks"].write_only = True
        self.fields["purpose_pk"].required = False
        self.fields["confirmed_at"].read_only = True
        self.fields["price"].read_only = True

    def validate(self, data):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))
        begin = begin.astimezone(DEFAULT_TIMEZONE)
        end = end.astimezone(DEFAULT_TIMEZONE)

        duration = end - begin
        reservation_units = data.get(
            "reservation_unit", getattr(self.instance, "reservation_unit", None)
        )
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()

        for reservation_unit in reservation_units:
            if reservation_unit.check_reservation_overlap(begin, end, self.instance):
                raise serializers.ValidationError(
                    "Overlapping reservations are not allowed."
                )

            scheduler = ReservationUnitReservationScheduler(
                reservation_unit, opening_hours_end=end.date()
            )
            is_reservation_unit_open = scheduler.is_reservation_unit_open(begin, end)
            if not is_reservation_unit_open:
                raise serializers.ValidationError(
                    "Reservation unit is not open within desired reservation time."
                )

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

        data["state"] = STATE_CHOICES.CREATED

        user = self.context.get("request").user
        if settings.TMP_PERMISSIONS_DISABLED and user.is_anonymous:
            user = None

        data["user"] = user

        return data

    def check_buffer_times(self, data, reservation_unit):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))

        reservation_after = reservation_unit.get_next_reservation(end, self.instance)
        reservation_before = reservation_unit.get_previous_reservation(
            begin, self.instance
        )

        if (
            reservation_before
            and reservation_before.buffer_time_after
            and (reservation_before.end + reservation_before.buffer_time_after) > begin
        ):
            raise serializers.ValidationError(
                "Existing reservation occurring before this has buffer time which overlaps this reservation."
            )

        if (
            reservation_after
            and reservation_after.buffer_time_before
            and (reservation_after.begin - reservation_after.buffer_time_before) < end
        ):
            raise serializers.ValidationError(
                "Existing reservation occurring after this has buffer time which overlaps this reservation."
            )
        if (
            reservation_unit.buffer_time_between_reservations
            and reservation_before
            and (
                reservation_before.end
                + reservation_unit.buffer_time_between_reservations
            )
            > begin
        ):
            raise serializers.ValidationError(
                "Reservation unit buffer time between reservations overlaps with current begin time."
            )
        if (
            reservation_unit.buffer_time_between_reservations
            and reservation_after
            and (
                reservation_after.begin
                - reservation_unit.buffer_time_between_reservations
            )
            < end
        ):
            raise serializers.ValidationError(
                "Reservation unit buffer time between reservations overlaps with current end time."
            )


class ReservationUpdateSerializer(
    PrimaryKeyUpdateSerializer, ReservationCreateSerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = False
        self.fields["state"].required = False
        self.fields[
            "state"
        ].help_text = "String value for ReservationType's ReservationState enum."
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

        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["user"] = self.instance.user  # Do not change the user.
        validated_data["confirmed_at"] = datetime.datetime.now(
            tz=get_default_timezone()
        )
        return validated_data


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
        validated_data["state"] = STATE_CHOICES.CONFIRMED
        return validated_data


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
