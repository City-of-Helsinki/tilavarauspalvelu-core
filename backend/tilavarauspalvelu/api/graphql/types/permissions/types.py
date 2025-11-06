from __future__ import annotations

from itertools import chain
from typing import TYPE_CHECKING

import graphene
from graphene import ObjectType
from graphene_django_extensions import DjangoNode
from query_optimizer import ManuallyOptimizedField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.enums import UserPermissionChoice
from tilavarauspalvelu.models import GeneralRole, Unit, UnitGroup, UnitRole

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import AnyUser, GQLInfo

__all__ = [
    "GeneralRoleNode",
    "PermissionCheckerType",
    "UnitRoleNode",
]


class GeneralRoleNode(DjangoNode):
    permissions = graphene.List(
        graphene.NonNull(graphene.Enum.from_enum(UserPermissionChoice)),
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
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []
        return user.active_general_permissions


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
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []

        # If user has this role in any of their active unit or unit group roles, return permissions for the role
        if root.role in chain(*user.active_unit_roles.values(), *user.active_unit_group_roles.values()):
            return sorted(root.role.permissions)

        return []

    @staticmethod
    def optimize_permissions(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        unit_optimizer = optimizer.get_or_set_child_optimizer(
            name="units",
            optimizer=QueryOptimizer(
                Unit,
                optimizer.info,
                name="units",
                parent=optimizer,
            ),
            set_as="prefetch_related",
        )
        unit_optimizer.only_fields.append("pk")
        unit_group_optimizer = optimizer.get_or_set_child_optimizer(
            name="unit_groups",
            optimizer=QueryOptimizer(
                UnitGroup,
                optimizer.info,
                name="unit_groups",
                parent=optimizer,
            ),
            set_as="prefetch_related",
        )
        unit_group_optimizer.only_fields.append("pk")
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
        if user.permissions.is_user_anonymous_or_inactive():
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
