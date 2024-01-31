from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import (
    can_create_staff_reservation,
    can_modify_recurring_reservation,
    can_view_recurring_reservation,
)
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation


class RecurringReservationPermission(BasePermission):
    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        recurring_reservation = RecurringReservation.objects.filter(id=id)
        if not recurring_reservation:
            return False
        return can_view_recurring_reservation(info.context.user, recurring_reservation)

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk", None)

        if pk:
            recurring_reservation = RecurringReservation.objects.filter(id=pk).first()
            if not recurring_reservation:
                return False

            return can_modify_recurring_reservation(info.context.user, recurring_reservation)

        reservation_unit_id = input.get("reservation_unit", None)

        if not reservation_unit_id:
            return False

        reservation_unit_qs = ReservationUnit.objects.filter(id=reservation_unit_id)

        return can_create_staff_reservation(info.context.user, reservation_unit_qs)
