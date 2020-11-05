from api.base import BaseNestedSerializer
from rest_framework import viewsets
from services.models import Service


class ServiceSerializer(BaseNestedSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]
        detail_only_fields = [
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()