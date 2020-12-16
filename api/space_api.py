from rest_framework import serializers, viewsets

from spaces.models import Building, Location, Space


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "district", "real_estate", "surface_area"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["address_street", "address_zip", "address_city"]


class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "surface_area"]


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all().select_related("parent", "building")
