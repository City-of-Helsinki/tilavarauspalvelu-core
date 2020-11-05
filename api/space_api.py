from api.base import BaseNestedSerializer
from rest_framework import viewsets
from spaces.models import Space


class SpaceSerializer(BaseNestedSerializer):
    class Meta:
        model = Space
        fields = ["id", "name", "parent", "building", "area"]
        detail_only_fields = ["parent", "building", "area"]


class SpaceViewSet(viewsets.ModelViewSet):
    serializer_class = SpaceSerializer
    queryset = Space.objects.all()