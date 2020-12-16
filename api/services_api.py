from rest_framework import viewsets

from api.base import TranslatedModelSerializer
from services.models import Service


class ServiceSerializer(TranslatedModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()
