from typing import Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from api.graphql.extensions import error_codes
from common.typing import AnyUser
from permissions.helpers import can_manage_spaces, can_manage_units_spaces
from spaces.models import Space, Unit

__all__ = [
    "SpacePermission",
]


class SpacePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit_pk: int | None = input_data.get("unit")
        if unit_pk is None:
            return can_manage_spaces(user)

        unit: Unit | None = Unit.objects.filter(pk=unit_pk).first()
        if unit is None:
            msg = f"Unit with pk {unit_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return can_manage_units_spaces(user, unit)

    @classmethod
    def has_update_permission(cls, instance: Space, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_units_spaces(user, instance.unit)

    @classmethod
    def has_delete_permission(cls, instance: Space, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_units_spaces(user, instance.unit)
