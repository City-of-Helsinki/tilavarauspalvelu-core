from __future__ import annotations

import enum

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "UserPermissionChoice",
    "UserRoleChoice",
]


class permission(classmethod): ...  # noqa: N801


class UserRoleChoice(models.TextChoices):
    """Which roles a user can have."""

    ADMIN = "ADMIN", _("Admin")
    HANDLER = "HANDLER", _("Handler")
    VIEWER = "VIEWER", _("Viewer")
    RESERVER = "RESERVER", _("Reserver")
    NOTIFICATION_MANAGER = "NOTIFICATION_MANAGER", _("Notification manager")

    @permission
    def can_manage_applications(cls) -> list[UserRoleChoice]:
        """
        This permission is required to modify applications and application sections
        that are not the user's own, as well as any application rounds.
        """
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_view_applications(cls) -> list[UserRoleChoice]:
        """
        Permission required to view applications and application sections
        that are not the user's own.
        """
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservations(cls) -> list[UserRoleChoice]:
        """Permission required to modify reservations that are not the user's own."""
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_view_reservations(cls) -> list[UserRoleChoice]:
        """
        Permission required to view reservation data, and comment on them,
        as well as to view some restricted information on recurring reservations.
        """
        return [UserRoleChoice.VIEWER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_create_staff_reservations(cls) -> list[UserRoleChoice]:
        """
        Permission required to create different types of reservations,
        like those on behalf of another user, or once that block reservable time.,
        or to create or modify recurring reservations.
        """
        return [UserRoleChoice.RESERVER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_units(cls) -> list[UserRoleChoice]:
        """
        Permission required to create and modify data related to reservation units
        like reservation units, images, payment info, units, spaces, and resources.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_view_users(cls) -> list[UserRoleChoice]:
        """Permission required to view user data."""
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_related_data(cls) -> list[UserRoleChoice]:
        """
        Permission required to create and modify data related to reservations,
        like equipment, categories, purposes, and age groups.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_notifications(cls) -> list[UserRoleChoice]:
        """Permission required to manage banner notifications."""
        return [UserRoleChoice.NOTIFICATION_MANAGER, UserRoleChoice.ADMIN]

    @classmethod
    def permission_map(cls) -> dict[UserPermissionChoice, list[UserRoleChoice]]:
        """Maps permissions to roles that have those permissions."""
        try:
            converter = UserPermissionChoice
        except NameError:
            # When creating 'UserPermissionChoice'
            def converter(x: str) -> str:
                return x

        return {
            converter(str(key).upper()): getattr(cls, key)()
            for key, value in cls.__dict__.items()
            if isinstance(value, permission)
        }

    @enum.property
    def permissions(self) -> list[UserPermissionChoice]:
        """List all permissions for a single role. Use like this: `UserRoleChoice.ADMIN.permissions`"""
        return [name for name, roles in UserRoleChoice.permission_map().items() if self in roles]


# There is the disadvantage that we don't get autocomplete of permissions like this,
# but we also don't duplicate permissions from the roles above. This should be fine,
# as the enum is not really used in our code but meant for the frontend.
UserPermissionChoice = models.TextChoices("UserPermissionChoice", sorted(UserRoleChoice.permission_map()))
