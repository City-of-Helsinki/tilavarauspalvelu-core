from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.models import ReservationUnit

if TYPE_CHECKING:
    from query_optimizer.typing import GraphQLFilterInfo

    from tilavarauspalvelu.models import RecurringReservation
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "RecurringReservationPermission",
]


class RecurringReservationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: RecurringReservation, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        if instance.user == user:
            return True
        return user.permissions.has_any_role()

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        reservation_unit = cls._get_reservation_unit(input_data)
        return user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=True)

    @classmethod
    def has_update_permission(cls, instance: RecurringReservation, user: AnyUser, input_data: dict[str, Any]) -> bool:
        is_reservee = instance.user == user
        return user.permissions.can_create_staff_reservation(instance.reservation_unit, is_reservee=is_reservee)

    @classmethod
    def _get_reservation_unit(cls, input_data: dict[str, Any]) -> ReservationUnit:
        pk = input_data.get("reservation_unit")
        if pk is None:
            msg = "Reservation Unit is required for creating a Recurring Reservation."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

        reservation_unit = ReservationUnit.objects.select_related("unit").filter(pk=pk).first()
        if reservation_unit is None:
            msg = f"Units for Reservation Unit with pk {pk} do not exist."
            raise GQLCodeError(msg, code=error_codes.ENTITY_NOT_FOUND)

        return reservation_unit
