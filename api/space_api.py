from rest_framework import viewsets

from api.base import TranslatedModelSerializer
from spaces.models import Building, Location, Space


class BuildingSerializer(TranslatedModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "district", "real_estate", "surface_area"]


class LocationSerializer(TranslatedModelSerializer):
    class Meta:
        model = Location
        fields = ["address_street", "address_zip", "address_city"]


class SpaceSerializer(TranslatedModelSerializer):
    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "surface_area"]


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all().select_related("parent", "building")
