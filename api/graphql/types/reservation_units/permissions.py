from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import (
    can_manage_equipment,
    can_manage_equipment_categories,
    can_manage_purposes,
    can_manage_qualifiers,
    can_manage_units_reservation_units,
)
from reservation_units.models import ReservationUnit, ReservationUnitImage
from spaces.models import Unit


class TaxPercentagePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class ReservationUnitCancellationRulePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class EquipmentCategoryPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_equipment_categories(info.context.user)


class EquipmentPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_equipment(info.context.user)


class KeywordPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class PurposePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_purposes(info.context.user)


class QualifierPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_qualifiers(info.context.user)


class ReservationUnitHaukiUrlPermission(BasePermission):
    """Check permissions in resolver level. Cannot figure out the permissions without knowing unit."""

    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return False

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        return False

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class ReservationUnitPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        unit_pk = input.get("unit_pk")
        pk = input.get("pk")
        if not unit_pk:
            unit_pk = getattr(ReservationUnit.objects.filter(pk=pk).first(), "unit_id", None)
        if not unit_pk:
            return False
        unit = Unit.objects.filter(id=unit_pk).first()
        return can_manage_units_reservation_units(info.context.user, unit)


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
