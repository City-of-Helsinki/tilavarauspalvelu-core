from typing import Any

from django.shortcuts import get_object_or_404
from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from permissions.helpers import (
    can_comment_reservation,
    can_create_staff_reservation,
    can_handle_reservation,
    can_manage_ability_groups,
    can_manage_age_groups,
    can_manage_reservation_purposes,
    can_modify_recurring_reservation,
    can_modify_reservation,
    can_view_recurring_reservation,
)
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation, Reservation


class ReservationMetadataSetPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False


class AgeGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_age_groups(info.context.user)


class AbilityGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_ability_groups(info.context.user)


class ReservationHandlingPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            user = info.context.user
            return can_handle_reservation(user, reservation) or (
                can_create_staff_reservation(user, reservation.reservation_unit.all()) and reservation.user == user
            )
        return False


class ReservationDenyPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            user = info.context.user
            return can_handle_reservation(user, reservation) or (
                can_create_staff_reservation(user, reservation.reservation_unit.all()) and reservation.user == user
            )
        return False


class ReservationRefundPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            return can_handle_reservation(info.context.user, reservation)
        return False


class StaffAdjustTimePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            user = info.context.user
            return can_handle_reservation(user, reservation) or (
                can_create_staff_reservation(user, reservation.reservation_unit.all()) and reservation.user == user
            )
        return False


class StaffReservationModifyPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            user = info.context.user

            return (
                user.has_staff_permissions
                and can_modify_reservation(user, reservation)
                or (can_create_staff_reservation(user, reservation.reservation_unit.all()) and reservation.user == user)
            )
        return False


class ReservationCommentPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=pk)
            return can_comment_reservation(info.context.user, reservation)
        return False


class ReservationStaffCreatePermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        reservation_unit_ids = input.get("reservation_unit_pks", [])
        reservation_units = ReservationUnit.objects.filter(id__in=reservation_unit_ids)
        return can_create_staff_reservation(info.context.user, reservation_units)


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
        pk = input.get("pk")

        if pk:
            recurring_reservation = RecurringReservation.objects.filter(id=pk).first()
            if not recurring_reservation:
                return False

            return can_modify_recurring_reservation(info.context.user, recurring_reservation)

        reservation_unit_id = input.get("reservation_unit_pk")

        if not reservation_unit_id:
            return False

        reservation_unit_qs = ReservationUnit.objects.filter(id=reservation_unit_id)

        return can_create_staff_reservation(info.context.user, reservation_unit_qs)


class ReservationPurposePermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_reservation_purposes(info.context.user)


class ReservationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        """
        Authenticated users can see reservations.

        The reservation fields has own permission checks.
        """
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        pk = input.get("pk")
        if pk:
            reservation = get_object_or_404(Reservation, pk=input.get("pk"))
            return can_modify_reservation(info.context.user, reservation)
        return info.context.user.is_authenticated

    @classmethod
    def has_filter_permission(cls, info: GQLInfo) -> bool:
        """
        Authenticated users can see reservations.

        The reservation fields has own permission checks.
        """
        return info.context.user.is_authenticated
