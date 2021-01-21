from rest_framework import viewsets

from api.base import TranslatedModelSerializer
from resources.models import Resource


class ResourceSerializer(TranslatedModelSerializer):
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
