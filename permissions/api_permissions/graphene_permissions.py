from typing import Any

from django.shortcuts import get_object_or_404
from graphene_permissions.permissions import BasePermission
from graphql import ResolveInfo

from permissions.helpers import (
    can_create_reservation,
    can_manage_ability_groups,
    can_manage_age_groups,
    can_manage_equipment,
    can_manage_equipment_categories,
    can_manage_purposes,
    can_manage_resources,
    can_manage_spaces,
    can_manage_units,
    can_manage_units_reservation_units,
    can_view_reservations,
)
from reservation_units.models import ReservationUnit
from reservations.models import Reservation
from spaces.models import Unit


class ReservationUnitHaukiUrlPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return False

    @classmethod
    def has_node_permission(cls, info: ResolveInfo, id: str) -> bool:
        # FIXME: needs a fix for permissions, not called currently TILA-777
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        unit_id = input.get("unit_id")
        pk = input.get("pk")
        if not unit_id:
            unit_id = getattr(
                ReservationUnit.objects.filter(pk=pk).first(), "unit_id", None
            )
        if not unit_id:
            return False
        unit = Unit.objects.filter(id=unit_id).first()
        return can_manage_units_reservation_units(info.context.user, unit)


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


class AgeGroupPermission(BasePermission):
    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_age_groups(info.context.user)


class AbilityGroupPermission(BasePermission):
    @classmethod
    def has_filter_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_ability_groups(info.context.user)


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


class UnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        pk = input.get("pk")
        unit = get_object_or_404(Unit, pk=pk)
        return can_manage_units(info.context.user, unit)


class KeywordPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return False


class EquipmentCategoryPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_equipment_categories(info.context.user)


class EquipmentPermission(BasePermission):
    @classmethod
    def has_permission(self, info: ResolveInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: ResolveInfo, input: dict) -> bool:
        return can_manage_equipment(info.context.user)
