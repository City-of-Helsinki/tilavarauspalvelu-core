from typing import Any

from graphene_django_extensions.permissions import BasePermission
from query_optimizer.typing import GraphQLFilterInfo

from tilavarauspalvelu.models import ReservationUnitOption
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationUnitOptionPermission",
]


class ReservationUnitOptionPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: ReservationUnitOption, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        application = instance.application_section.application
        if application.user == user:
            return True

        return user.permissions.has_any_role()

    @classmethod
    def has_update_permission(cls, instance: ReservationUnitOption, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_applications_for_units([instance.reservation_unit.unit])
