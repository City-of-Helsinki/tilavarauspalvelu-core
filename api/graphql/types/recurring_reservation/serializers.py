from rest_framework import serializers

from common.serializers import TranslatedModelSerializer
from reservations.models import RecurringReservation


class RecurringReservationCreateSerializer(TranslatedModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "name",
            "description",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
            "recurrence_in_days",
            "weekdays",
            "reservation_unit",
            "user",
            "age_group",
            "ability_group",
        ]


class RecurringReservationUpdateSerializer(RecurringReservationCreateSerializer):
    class Meta:
        model = RecurringReservation
        fields = [
            field
            for field in RecurringReservationCreateSerializer.Meta.fields
            if field not in ["user", "reservation_unit"]
        ]
