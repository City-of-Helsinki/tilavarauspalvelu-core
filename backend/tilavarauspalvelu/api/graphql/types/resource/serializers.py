from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

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
        ]

    def validate_location_type(self, value: Any) -> str:
        if not value or value not in ResourceLocationType.values:
            msg = f"Wrong type of location type. Values are: {ResourceLocationType.values}"
            raise ValidationError(msg)
        return value

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        location_type = self.get_or_default("location_type", data)
        space = self.get_or_default("space", data)
        if location_type == ResourceLocationType.FIXED.value and not space:
            msg = "Location type 'fixed' needs a space to be defined."
            raise ValidationError(msg)
        return data
