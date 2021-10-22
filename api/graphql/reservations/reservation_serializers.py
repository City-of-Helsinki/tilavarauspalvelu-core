from django.conf import settings
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
from reservations.models import STATE_CHOICES, Reservation


class ReservationCreateSerializer(PrimaryKeySerializer):
    reservation_unit_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all()),
        source="reservation_unit",
    )
    priority = serializers.IntegerField()

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "priority",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_unit_pks",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["reservation_unit_pks"].write_only = True

    def validate(self, data):
        begin = data.get("begin", getattr(self.instance, "begin", None))
        end = data.get("end", getattr(self.instance, "end", None))
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

            scheduler = ReservationUnitReservationScheduler(reservation_unit)
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

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.CREATED

        user = self.context.get("request").user
        if settings.TMP_PERMISSIONS_DISABLED and user.is_anonymous:
            user = None

        validated_data["user"] = user
        return validated_data


class ReservationUpdateSerializer(
    PrimaryKeyUpdateSerializer, ReservationCreateSerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["priority"].required = False
        self.fields["begin"].required = False
        self.fields["end"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False

    def validate(self, data):
        if self.instance.state not in (STATE_CHOICES.CREATED, STATE_CHOICES.REQUESTED):
            raise serializers.ValidationError("Reservation cannot be changed anymore.")

        data = super().validate(data)
        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = self.instance.state
        validated_data["user"] = self.instance.user
        return validated_data
