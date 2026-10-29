from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import Space

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Unit

__all__ = [
    "SpaceSerializer",
]


class SpaceSerializer(NestingModelSerializer[Space]):
    instance: Space | None

    class Meta:
        model = Space
        fields = [
            "pk",
            "name",
            "surface_area",
            "max_persons",
            "code",
            "unit",
            "parent",
        ]

    def validate_unit(self, unit: Unit) -> Unit:
        if self.instance is not None and unit.pk != self.instance.unit_id:
            msg = "Space cannot be moved to another unit."
            raise ValidationError(msg)

        return unit

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        unit: Unit = self.get_or_default("unit", data)
        parent: Space | None = self.get_or_default("parent", data)
        if parent and parent.unit_id != unit.pk:
            msg = "Parent space must be in the same unit."
            raise ValidationError(msg)

        return data
