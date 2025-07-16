from __future__ import annotations

from tilavarauspalvelu.models import Space

__all__ = [
    "SpaceSerializer",
]


class SpaceSerializer(NestingModelSerializer):
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
