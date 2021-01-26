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
        extra_kwargs = {
            "name": {
                "help_text": "State of the reservation. Default is 'created'.",
            },
            "location_type": {
                "help_text": "Priority of this reservation. Higher priority reservations replaces lower ones.",
            },
            "space": {
                "help_text": "Buffer time while reservation unit is unreservable before the reservation. "
                "Dynamically calculated from spaces and resources.",
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
