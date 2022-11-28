from api.base import TranslatedModelSerializer
from services.models import Service


class ServiceSerializer(TranslatedModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the service.",
            },
            "service_type": {
                "help_text": "Type of the service.",
            },
            "buffer_time_before": {
                "help_text": "Buffer time required before reservation if this service is used.",
            },
            "buffer_time_after": {
                "help_text": "Buffer time required after reservation if this service is used.",
            },
        }
