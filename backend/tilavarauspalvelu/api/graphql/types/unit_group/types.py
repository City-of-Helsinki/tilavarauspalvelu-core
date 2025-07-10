from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import UnitGroup

from .filtersets import UnitGroupFilterSet
from .permissions import UnitGroupPermission

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "UnitGroupNode",
]


class UnitGroupNode(DjangoNode):
    class Meta:
        model = UnitGroup
        fields = [
            "pk",
            "name",
            "units",
        ]
        permission_classes = [UnitGroupPermission]
        filterset_class = UnitGroupFilterSet

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        # Always hide UnitGroups that don't have any units.
        # They are not useful for the frontend, as UnitGroups are set to units outside of the GraphQL API.
        return queryset.exclude(units__isnull=True).distinct()
