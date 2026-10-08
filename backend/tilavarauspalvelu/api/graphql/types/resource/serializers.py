from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import ResourceLocationType
from tilavarauspalvelu.models import Resource

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Space

__all__ = [
    "ResourceSerializer",
]


class ResourceSerializer(NestingModelSerializer):
    instance: Resource | None

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

    def validate_space(self, space: Space | None) -> Space | None:
        current_space = self.instance.space if self.instance is not None else None
        if current_space is not None and space is not None and space.unit_id != current_space.unit_id:
            msg = "Resource cannot be moved to a space in another unit."
            raise ValidationError(msg)

        return space

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        location_type = self.get_or_default("location_type", data)
        space = self.get_or_default("space", data)
        if location_type == ResourceLocationType.FIXED.value and not space:
            msg = "Location type 'fixed' needs a space to be defined."
            raise ValidationError(msg)
        return data
