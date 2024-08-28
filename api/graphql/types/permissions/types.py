import graphene
from django.db import models
from graphene import ObjectType
from graphene_django_extensions import DjangoNode
from query_optimizer import ManuallyOptimizedField
from query_optimizer.optimizer import QueryOptimizer

from common.typing import AnyUser, GQLInfo
from permissions.enums import UserPermissionChoice
from permissions.models import GeneralRole, UnitRole
from spaces.models import Unit, UnitGroup

__all__ = [
    "GeneralRoleNode",
    "PermissionCheckerType",
    "UnitRoleNode",
]


class GeneralRoleNode(DjangoNode):
    permissions = graphene.List(graphene.Enum.from_enum(UserPermissionChoice))

    class Meta:
        model = GeneralRole
        fields = [
            "user",
            "role",
            "assigner",
            "created",
            "modified",
            "permissions",
        ]

    def resolve_permissions(root: GeneralRole, info: GQLInfo) -> list[UserPermissionChoice]:
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []
        return user.general_permissions_list


class UnitRoleNode(DjangoNode):
    permissions = ManuallyOptimizedField(graphene.List(graphene.Enum.from_enum(UserPermissionChoice)))

    class Meta:
        model = UnitRole
        fields = [
            "user",
            "role",
            "units",
            "unit_groups",
            "assigner",
            "created",
            "modified",
            "permissions",
        ]

    def resolve_permissions(root: UnitRole, info: GQLInfo) -> list[UserPermissionChoice]:
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []

        permissions: list[UserPermissionChoice] = []
        for unit in root.units.all():
            permissions += user.unit_permissions_map.get(unit.pk, [])
        for unit_group in root.unit_groups.all():
            permissions += user.unit_group_permissions_map.get(unit_group.pk, [])

        return sorted(set(permissions))

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
    has_permission = graphene.Field(graphene.NonNull(graphene.Boolean))

    @classmethod
    def run(
        cls,
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
        if permission in user.general_permissions_list:
            return {"has_permission": True}

        return {
            "has_permission": user.permissions.has_permission_for_unit_or_their_unit_group(
                permission=permission,
                unit_ids=unit_ids,
                require_all=require_all,
            )
        }
