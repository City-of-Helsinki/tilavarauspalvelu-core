from graphene_django_extensions import DjangoNode

from common.typing import AnyUser
from spaces.models import Unit

from .filtersets import UnitFilterSet
from .permissions import UnitPermission

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
            "payment_merchant",
            "reservationunit_set",
            "spaces",
            "location",
            "service_sectors",
            "unit_groups",
        ]
        restricted_fields = {
            "payment_merchant": private_field_check,
        }
        filterset_class = UnitFilterSet
        permission_classes = [UnitPermission]
        max_complexity = 12
