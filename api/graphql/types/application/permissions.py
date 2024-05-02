from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db.models import Prefetch
from graphene_django_extensions.permissions import BasePermission

from applications.models import ReservationUnitOption
from common.typing import AnyUser
from permissions.helpers import (
    can_modify_application,
    can_read_application,
    has_general_permission,
    has_unit_permission,
)

if TYPE_CHECKING:
    from applications.models import Application


class ApplicationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: Application, user: AnyUser, filters: dict[str, Any]) -> bool:
        return can_read_application(user, instance)

    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_modify_application(user, instance)


class UpdateAllApplicationOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if has_general_permission(user, required_permission="can_handle_applications"):
            return True

        units = [
            unit_id
            for section in instance.application_sections.all().prefetch_related(
                Prefetch(
                    "reservation_unit_options",
                    ReservationUnitOption.objects.all().select_related("reservation_unit__unit"),
                )
            )
            for unit_id in section.reservation_unit_options.all().values_list("reservation_unit__unit__id", flat=True)
        ]
        return all(has_unit_permission(user, "can_handle_applications", [unit]) for unit in units)
