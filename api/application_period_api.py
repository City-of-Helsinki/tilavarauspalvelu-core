from rest_framework import serializers, viewsets

from applications.models import ApplicationPeriod
from reservation_units.models import Purpose, ReservationUnit


class ApplicationPeriodSerializer(serializers.ModelSerializer):
    reservation_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=ReservationUnit.objects.all(),
        source="reservation_units",
        help_text="List of ids of reservation units available in this application period.",
        many=True,
    )
    purpose_ids = serializers.PrimaryKeyRelatedField(
        queryset=Purpose.objects.all(),
        source="purposes",
        help_text="List of ids of purposes that are allowed for events applied for this application period.",
        many=True,
    )

    class Meta:
        model = ApplicationPeriod
        fields = [
            "id",
            "name",
            "reservation_unit_ids",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "purpose_ids",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this event.",
            },
            "application_period_begin": {
                "help_text": "Begin date and time of the period when applications can be sent.",
            },
            "application_period_end": {
                "help_text": "End date and time of the period when applications can be sent.",
            },
            "reservation_period_begin": {
                "help_text": "Begin date and time of the period where applied reservation are allocated.",
            },
            "reservation_period_end": {
                "help_text": "End date and time of the period where applied reservation are allocated.",
            },
        }


class ApplicationPeriodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApplicationPeriod.objects.all()
    serializer_class = ApplicationPeriodSerializer
