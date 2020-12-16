from rest_framework import viewsets

from spaces.models import Space
from api.base import TranslatedModelSerializer


class SpaceSerializer(TranslatedModelSerializer):
    class Meta:
        model = Space
        fields = [
            "id",
            "name",
            "parent",
            "building",
            "surface_area",
        ]


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all().select_related("parent", "building")
