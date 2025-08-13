from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import UserPermissionChoice
from tilavarauspalvelu.models import UnitRole, User
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "UnitRoleNode",
]


class UnitRoleNode(QueryType[UnitRole], interfaces=[Node]):
    user = Field()
    role = Field()
    units = Field()
    unit_groups = Field()
    assigner = Field()
    created_at = Field()
    updated_at = Field()

    @Field
    def permissions(root: UnitRole, info: GQLInfo[User]) -> list[UserPermissionChoice]:
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []

        permissions: list[UserPermissionChoice] = []
        for unit in root.units.all():
            permissions += user.active_unit_permissions.get(unit.pk, [])
        for unit_group in root.unit_groups.all():
            permissions += user.active_unit_group_permissions.get(unit_group.pk, [])

        return sorted(set(permissions))

    @permissions.optimize
    def optimize_permissions(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("is_from_ad_group")
        data.only_fields.add("role")

        units_data = data.add_prefetch_related("units")
        units_data.only_fields.add("allow_permissions_from_ad_groups")

        units_data.add_prefetch_related("unit_groups")
