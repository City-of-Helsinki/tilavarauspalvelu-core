from typing import Any

from graphene_permissions.permissions import BasePermission
from graphql import ResolveInfo

from permissions.helpers import (
    can_create_reservation,
    can_manage_purposes,
    can_manage_resources,
    can_manage_spaces,
    can_modify_reservation_unit,
    can_view_reservations,
)
from reservation_units.models import ReservationUnit
from reservations.models import Reservation


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        res_unit = ReservationUnit.objects.filter(id=input["id"])
        return can_modify_reservation_unit(info.context.user, res_unit)


class ResourcePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_resources(info.context.user)


class ReservationPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        reservation = Reservation(**input)
        return can_create_reservation(info.context.user, reservation)

    @classmethod
    def has_filter_permission(self, info: ResolveInfo) -> bool:
        return can_view_reservations(info.context.user)


class PurposePermission(BasePermission):
    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_purposes(info.context.user)


class SpacePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_spaces(info.context.user)
