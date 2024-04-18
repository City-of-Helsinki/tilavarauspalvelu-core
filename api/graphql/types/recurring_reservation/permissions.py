from typing import Any

from graphene_django_extensions.permissions import BasePermission
from query_optimizer.typing import GraphQLFilterInfo

from common.typing import AnyUser
from permissions.helpers import can_create_staff_reservation, can_view_recurring_reservation
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation

__all__ = [
    "RecurringReservationPermission",
]


class RecurringReservationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: RecurringReservation, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        return can_view_recurring_reservation(user, instance)

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        reservation_unit_pk: int | None = input_data.get("reservation_unit")
        if reservation_unit_pk is None:
            return False

        units: list[int] = list(ReservationUnit.objects.filter(pk=reservation_unit_pk).values_list("unit", flat=True))
        if not units:
            return False
        return can_create_staff_reservation(user, units)

    @classmethod
    def has_update_permission(cls, instance: RecurringReservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_create_staff_reservation(user, [instance.reservation_unit.unit.pk])
