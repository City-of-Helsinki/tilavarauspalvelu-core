from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import Unit

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Space
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "SpacePermission",
]


class SpacePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        unit = cls._get_unit(input_data)
        return user.permissions.can_manage_spaces(unit)

    @classmethod
    def has_update_permission(cls, instance: Space, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_spaces(instance.unit)

    @classmethod
    def has_delete_permission(cls, instance: Space, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_spaces(instance.unit)

    @classmethod
    def _get_unit(cls, input_data: dict[str, Any]) -> Unit | None:
        unit_pk: int | None = input_data.get("unit")
        if unit_pk is None:  # Unit is optional for creating a Space
            return None

        unit: Unit | None = Unit.objects.filter(pk=unit_pk).first()
        if unit is None:
            msg = f"Unit with pk {unit_pk} does not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return unit
