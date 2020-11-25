from rest_framework import viewsets, serializers

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


class ApplicationPeriodViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApplicationPeriod.objects.all()
    serializer_class = ApplicationPeriodSerializer
