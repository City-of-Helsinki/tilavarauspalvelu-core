from graphene_django_extensions import DjangoNode

from api.graphql.types.unit.permissions import UnitPermission
from permissions.helpers import can_manage_units
from spaces.models import Unit
from users.models import User

from .filtersets import UnitFilterSet

__all__ = [
    "UnitNode",
]


def private_field_check(user: User, unit: Unit) -> bool | None:
    result = can_manage_units(user, unit)
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
            "payment_merchant",
        ]
        restricted_fields = {
            "payment_merchant": private_field_check,
        }
        filterset_class = UnitFilterSet
        permission_classes = [UnitPermission]
        max_complexity = 11
