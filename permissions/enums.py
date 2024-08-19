from __future__ import annotations

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
        """Permission required to create, update and delete application data."""
        return [UserRoleChoice.ADMIN]

    @permission
    def can_view_applications(cls) -> list[UserRoleChoice]:
        """Permission required to view application data and make comments on applications."""
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservations(cls) -> list[UserRoleChoice]:
        """Permission required to create, update and delete reservation data."""
        return [UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_view_reservations(cls) -> list[UserRoleChoice]:
        """Permission required to view reservation data."""
        return [UserRoleChoice.VIEWER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_create_staff_reservations(cls) -> list[UserRoleChoice]:
        """Permission required to create staff reservations."""
        return [UserRoleChoice.RESERVER, UserRoleChoice.HANDLER, UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_units(cls) -> list[UserRoleChoice]:
        """
        Permission required to create, update and delete data related to reservation units
        like reservation units, units, spaces, and resources.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_view_users(cls) -> list[UserRoleChoice]:
        """Permission required to view user data."""
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_reservation_related_data(cls) -> list[UserRoleChoice]:
        """
        Permission required to create, update and delete data related to reservations,
        like equipment, categories, purposes, and age groups.
        """
        return [UserRoleChoice.ADMIN]

    @permission
    def can_manage_notifications(cls) -> list[UserRoleChoice]:
        """Permission required to manage banner notifications."""
        return [UserRoleChoice.NOTIFICATION_MANAGER, UserRoleChoice.ADMIN]

    @classmethod
    def permissions(cls) -> list[str]:
        """List of all permissions."""
        return [str(key).upper() for key, value in cls.__dict__.items() if isinstance(value, permission)]


UserPermissionChoice = models.TextChoices("UserPermissionChoice", list(UserRoleChoice.permissions()))
