from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "UpdateAllSectionOptionsPermission",
]


class UpdateAllSectionOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: ApplicationSection, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False

        from tilavarauspalvelu.models import Unit

        units = (
            Unit.objects.filter(reservation_units__reservation_unit_options__application_section=instance)
            .prefetch_related("unit_groups")
            .distinct()
        )
        return user.permissions.can_manage_applications_for_units(units)
