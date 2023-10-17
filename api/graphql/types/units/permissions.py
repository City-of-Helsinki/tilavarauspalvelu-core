from typing import Any

from django.shortcuts import get_object_or_404
from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_units
from spaces.models import Unit


class UnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        unit = get_object_or_404(Unit, pk=pk)
        return can_manage_units(info.context.user, unit)
