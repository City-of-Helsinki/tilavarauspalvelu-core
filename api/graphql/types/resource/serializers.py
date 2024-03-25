from typing import Any

from graphene_django_extensions import NestingModelSerializer
from graphql import GraphQLError

from resources.choices import ResourceLocationType
from resources.models import Resource

__all__ = [
    "ResourceSerializer",
]


class ResourceSerializer(NestingModelSerializer):
    class Meta:
        model = Resource
        fields = [
            "pk",
            "name",
            "location_type",
            "space",
            "buffer_time_before",
            "buffer_time_after",
        ]

    def validate_location_type(self, value: Any) -> str:
        if not value or value not in ResourceLocationType.values:
            raise GraphQLError(f"Wrong type of location type. Values are: {ResourceLocationType.values}")
        return value

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        location_type = self.get_or_default("location_type", data)
        space = self.get_or_default("space", data)
        if location_type == ResourceLocationType.FIXED.value and not space:
            raise GraphQLError("Location type 'fixed' needs a space to be defined.")
        return data
