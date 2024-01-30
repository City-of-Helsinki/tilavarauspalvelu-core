from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import can_manage_units_reservation_units
from reservation_units.models import ReservationUnitImage
from spaces.models import Unit


class ReservationUnitImagePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        if input.get("pk"):
            reservation_unit_pk = (
                ReservationUnitImage.objects.filter(id=input.get("pk"))
                .values_list("reservation_unit_id", flat=True)
                .first()
            )
        else:
            reservation_unit_pk = input.get("reservation_unit_pk")
        if not reservation_unit_pk:
            return False

        unit = Unit.objects.filter(reservationunit=reservation_unit_pk).first()
        if not unit:
            return False
        return can_manage_units_reservation_units(info.context.user, unit)
