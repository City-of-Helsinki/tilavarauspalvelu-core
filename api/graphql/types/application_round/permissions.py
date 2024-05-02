from typing import Any

from graphene_django_extensions.permissions import BasePermission

from applications.models import ApplicationRound
from common.typing import AnyUser
from permissions.helpers import has_general_permission, has_unit_permission
from spaces.models import Unit


class ApplicationRoundPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False

    @classmethod
    def has_update_permission(cls, instance: ApplicationRound, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True
        if has_general_permission(user, "can_handle_applications"):
            return True

        units = (
            Unit.objects.filter(reservationunit__application_rounds=instance).distinct().values_list("pk", flat=True)
        )
        return all(has_unit_permission(user, "can_handle_applications", [unit]) for unit in units)
