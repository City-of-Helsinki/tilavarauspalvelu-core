from rest_framework import serializers, viewsets

from services.models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name_fi",
            "name_en",
            "name_sv",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()
