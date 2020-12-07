from rest_framework import serializers, viewsets

from spaces.models import Space


class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = [
            "id",
            "name_fi",
            "name_en",
            "name_sv",
            "parent",
            "building",
            "surface_area",
        ]


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all().select_related("parent", "building")
