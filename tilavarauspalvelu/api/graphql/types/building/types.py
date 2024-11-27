from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Building

__all__ = [
    "BuildingName",
]


class BuildingName(DjangoNode):
    class Meta:
        model = Building
        fields = [
            "pk",
            "name",
            "surface_area",
        ]
