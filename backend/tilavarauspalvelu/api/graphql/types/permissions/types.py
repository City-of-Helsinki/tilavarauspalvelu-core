from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene import ObjectType
from graphene_django_extensions import DjangoNode
from query_optimizer import ManuallyOptimizedField

from tilavarauspalvelu.enums import UserPermissionChoice
from tilavarauspalvelu.models import GeneralRole, UnitRole

if TYPE_CHECKING:
    from django.db import models
    from query_optimizer.optimizer import QueryOptimizer

    from tilavarauspalvelu.typing import AnyUser, GQLInfo

__all__ = [
    "GeneralRoleNode",
    "PermissionCheckerType",
    "UnitRoleNode",
]


class GeneralRoleNode(DjangoNode):
    permissions = ManuallyOptimizedField(
        graphene.List(graphene.NonNull(graphene.Enum.from_enum(UserPermissionChoice))),
        required=True,
    )

    class Meta:
        model = GeneralRole
        fields = [
            "user",
            "role",
            "assigner",
            "created_at",
            "updated_at",
            "permissions",
        ]

    def resolve_permissions(root: GeneralRole, info: GQLInfo) -> list[UserPermissionChoice]:
        return sorted(root.role.permissions)

    @staticmethod
    def optimize_permissions(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        optimizer.only_fields.append("role")
        return queryset


class UnitRoleNode(DjangoNode):
    permissions = ManuallyOptimizedField(
        graphene.List(graphene.NonNull(graphene.Enum.from_enum(UserPermissionChoice))),
        required=True,
    )

    class Meta:
        model = UnitRole
        fields = [
            "user",
            "role",
            "units",
            "unit_groups",
            "assigner",
            "created_at",
            "updated_at",
            "permissions",
        ]

    def resolve_permissions(root: UnitRole, info: GQLInfo) -> list[UserPermissionChoice]:
        return sorted(root.role.permissions)

    @staticmethod
    def optimize_permissions(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        optimizer.only_fields.append("role")
        return queryset


class PermissionCheckerType(ObjectType):
    has_permission = graphene.Boolean(required=True)

    @classmethod
    def run(
        cls,
        *,
        user: AnyUser,
        permission: UserPermissionChoice,
        unit_ids: list[int],
        require_all: bool = False,
    ) -> dict[str, bool]:
        # Anonymous or inactive users have no permissions
        if user.is_anonymous or not user.is_active:
            return {"has_permission": False}

        # Superusers have all permissions
        if user.is_superuser:
            return {"has_permission": True}

        # Has the given permission through their general roles
        if permission in user.active_general_permissions:
            return {"has_permission": True}

        return {
            "has_permission": user.permissions.has_permission_for_unit_or_their_unit_group(
                permission=permission,
                unit_ids=unit_ids,
                require_all=require_all,
            )
        }
