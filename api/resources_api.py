from rest_framework import serializers, viewsets

from api.base import TranslatedModelSerializer
from permissions.api_permissions.drf_permissions import ResourcePermission
from resources.models import Resource, Space


class ResourceSerializer(TranslatedModelSerializer):
    space_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="space",
        help_text="Id of related space for this resource.",
    )

    class Meta:
        model = Resource
        fields = [
            "id",
            "location_type",
            "name",
            "space_id",
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "State of the reservation. Default is 'created'.",
            },
            "location_type": {
                "help_text": "Priority of this reservation. Higher priority reservations replaces lower ones.",
            },
            "buffer_time_before": {
                "help_text": "Buffer time while reservation unit is unreservable after the reservation. "
                "Dynamically calculated from spaces and resources.",
            },
            "buffer_time_after": {
                "help_text": "Begin date and time of the reservation.",
            },
        }


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    queryset = Resource.objects.all()
    permission_classes = [ResourcePermission]
