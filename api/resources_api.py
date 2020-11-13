from rest_framework import serializers
from rest_framework import viewsets
from resources.models import Resource


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            "id",
            "location_type",
            "name",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        ]


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    queryset = Resource.objects.all()
