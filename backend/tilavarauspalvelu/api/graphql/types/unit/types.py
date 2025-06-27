from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Unit

from .filtersets import UnitAllFilterSet, UnitFilterSet
from .permissions import UnitAllPermission, UnitPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "UnitNode",
]


def private_field_check(user: AnyUser, unit: Unit) -> bool | None:
    result = user.permissions.can_manage_unit(unit)
    return True if result else None


class UnitNode(DjangoNode):
    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
            "address_street",
            "address_zip",
            "address_city",
            "reservation_units",
            "spaces",
            "unit_groups",
            "payment_merchant",
        ]
        restricted_fields = {
            "payment_merchant": private_field_check,
        }
        filterset_class = UnitFilterSet
        permission_classes = [UnitPermission]
        max_complexity = 12


class UnitAllNode(DjangoNode):
    """This Node should be kept to the bare minimum and never expose any relations to avoid performance issues."""

    class Meta:
        model = Unit
        fields = [
            "pk",
            "tprek_id",
            "name",
        ]
        filterset_class = UnitAllFilterSet
        permission_classes = [UnitAllPermission]
        skip_registry = True
