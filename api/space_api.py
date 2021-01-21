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
    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "surface_area", "district"]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the space.",
            },
            "parent": {
                "help_text": "Id of parent space for this space. "
                "Spaces are represented as a tree hierarchy in this system.",
            },
            "building": {
                "help_text": "Buffer time while reservation unit is unreservable before the reservation. "
                "Dynamically calculated from spaces and resources.",
            },
            "surface_area": {
                "help_text": "Surface area of the space as square meters",
            },
            "district": {
                "help_text": "Id of the district where this space is located.",
            },
        }


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all().select_related("parent", "building")
