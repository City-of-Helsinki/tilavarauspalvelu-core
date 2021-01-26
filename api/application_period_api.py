from rest_framework import serializers, viewsets

from applications.models import ApplicationPeriod


class ApplicationPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationPeriod
        fields = [
            "id",
            "name",
            "reservation_units",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "purposes",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this event.",
            },
            "reservation_units": {
                "help_text": "Ids of reservation units that can be applied during this period.",
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
            "purposes": {
                "help_text": "Ids of purposes that are allowed for events applied for this application period.",
            },
        }


class ApplicationPeriodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApplicationPeriod.objects.all()
    serializer_class = ApplicationPeriodSerializer
