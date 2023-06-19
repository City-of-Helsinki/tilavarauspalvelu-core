from rest_framework import serializers

from api.base import TranslatedModelSerializer
from spaces.models import Building, Location, Space


class BuildingSerializer(TranslatedModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "real_estate", "surface_area"]


class LocationSerializer(TranslatedModelSerializer):
    coordinates = serializers.SerializerMethodField()

    def get_coordinates(self, obj):
        return {"longitude": obj.lon, "latitude": obj.lat}

    class Meta:
        model = Location
        fields = ["address_street", "address_zip", "address_city", "coordinates"]
        extra_kwargs = {
            "address_street": {
                "help_text": "Street name and number for the location.",
            },
            "address_zip": {
                "help_text": "Zip code of the location.",
            },
            "address_city": {
                "help_text": "City of the location.",
            },
        }


class SpaceSerializer(TranslatedModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="parent",
        help_text="Id of parent space for this space.",
        allow_null=True,
    )
    building_id = serializers.PrimaryKeyRelatedField(
        queryset=Building.objects.all(),
        source="building",
        help_text="Id of building for this space.",
        allow_null=True,
    )
    name = serializers.CharField()

    class Meta:
        model = Space
        fields = [
            "id",
            "name",
            "parent_id",
            "building_id",
            "surface_area",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the space.",
            },
            "surface_area": {
                "help_text": "Surface area of the space as square meters",
            },
        }
