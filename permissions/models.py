from django.db import models
from django.utils.translation import gettext_lazy as _

from permissions.base_models import BaseRole
from spaces.models import ServiceSector, Unit, UnitGroup

__all__ = [
    "GeneralPermissionChoices",
    "GeneralRole",
    "GeneralRoleChoice",
    "GeneralRolePermission",
    "ServiceSectorPermissionsChoices",
    "ServiceSectorRole",
    "ServiceSectorRoleChoice",
    "ServiceSectorRolePermission",
    "UnitPermissionChoices",
    "UnitRole",
    "UnitRoleChoice",
    "UnitRolePermission",
]


# General


class GeneralPermissionChoices(models.TextChoices):
    CAN_MANAGE_GENERAL_ROLES = (
        "can_manage_general_roles",
        _("Can manage general roles for the whole system"),
    )
    CAN_MANAGE_SERVICE_SECTOR_ROLES = (
        "can_manage_service_sector_roles",
        _("Can manage roles for service sectors for the whole system"),
    )
    CAN_MANAGE_UNIT_ROLES = (
        "can_manage_unit_roles",
        _("Can manage roles for units in the whole system"),
    )
    CAN_MANAGE_RESERVATION_UNITS = (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the whole system"),
    )
    CAN_MANAGE_PURPOSES = (
        "can_manage_purposes",
        _("Can create, edit and delete purposes in the whole system"),
    )
    CAN_MANAGE_RESERVATION_PURPOSES = (
        "can_manage_reservation_purposes",
        _("Can create, edit and delete reservation purposes in the whole system"),
    )
    CAN_MANAGE_AGE_GROUPS = (
        "can_manage_age_groups",
        _("Can create, edit and delete age groups in the whole system"),
    )
    CAN_MANAGE_QUALIFIERS = (
        "can_manage_qualifiers",
        _("Can create, edit and delete qualifiers in the whole system"),
    )
    CAN_MANAGE_ABILITY_GROUPS = (
        "can_manage_ability_groups",
        _("Can create, edit and delete ability groups in the whole system"),
    )
    CAN_MANAGE_RESERVATION_UNIT_TYPES = (
        "can_manage_reservation_unit_types",
        _("Can create, edit and delete reservation unit types in the whole system"),
    )
    CAN_MANAGE_EQUIPMENT_CATEGORIES = (
        "can_manage_equipment_categories",
        _("Can create, edit and delete equipment_categories in the whole system"),
    )
    CAN_MANAGE_EQUIPMENT = (
        "can_manage_equipment",
        _("Can create, edit and delete equipment in the whole system"),
    )
    CAN_MANAGE_RESERVATIONS = (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the whole system"),
    )
    CAN_VIEW_RESERVATIONS = (
        "can_view_reservations",
        _("Can view details of all reservations in the whole system"),
    )
    CAN_MANAGE_RESOURCES = (
        "can_manage_resources",
        _("Can create, edit and delete resources in the whole system"),
    )
    CAN_MANAGE_SPACES = (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the whole system"),
    )
    CAN_HANDLE_APPLICATIONS = (
        "can_handle_applications",
        _("Can handle applications in the whole system"),
    )
    CAN_VALIDATE_APPLICATIONS = (
        "can_validate_applications",
        _("Can validate applications in the whole system"),
    )
    CAN_ALLOCATE_APPLICATIONS = (
        "can_allocate_applications",
        _("Can allocate applications in the whole system"),
    )
    CAN_MANAGE_APPLICATION_ROUNDS = (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the whole system"),
    )
    CAN_VIEW_USERS = (
        "can_view_users",
        _("Can view users in the whole system"),
    )
    CAN_COMMENT_RESERVATIONS = (
        "can_comment_reservations",
        _("Can comment reservations in the whole system"),
    )
    CAN_CREATE_STAFF_RESERVATIONS = (
        "can_create_staff_reservations",
        _("Can create staff reservations in the whole system"),
    )
    CAN_MANAGE_UNITS = (
        "can_manage_units",
        _("Can edit unit information in the whole system"),
    )
    CAN_MANAGE_NOTIFICATIONS = (
        "can_manage_notifications",
        _("Can create, edit and delete banner notifications in the whole system"),
    )


class GeneralRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

    # Translated field hints
    verbose_name_fi: str | None
    verbose_name_sv: str | None
    verbose_name_en: str | None

    class Meta:
        db_table = "general_role_choice"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return self.verbose_name


class GeneralRolePermission(models.Model):
    role = models.ForeignKey(
        GeneralRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"),
        max_length=255,
        choices=GeneralPermissionChoices.choices,
    )

    class Meta:
        db_table = "general_role_permission"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"GeneralRolePermission {self.role.verbose_name} ({self.permission})"


class GeneralRole(BaseRole):
    role = models.ForeignKey(
        GeneralRoleChoice,
        verbose_name=_("Role"),
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        "users.User",
        verbose_name=_("User"),
        related_name="general_roles",
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "general_role"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"


# Unit


class UnitPermissionChoices(models.TextChoices):
    CAN_MANAGE_UNIT_ROLES = (
        "can_manage_unit_roles",
        _("Can modify roles for the unit"),
    )
    CAN_MANAGE_RESERVATION_UNITS = (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the unit"),
    )
    CAN_MANAGE_RESERVATIONS = (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the unit"),
    )
    CAN_VIEW_RESERVATIONS = (
        "can_view_reservations",
        _("Can view details of all reservations in the unit"),
    )
    CAN_VIEW_USERS = (
        "can_view_users",
        _("Can view users in the whole system"),
    )
    CAN_VALIDATE_APPLICATIONS = (
        "can_validate_applications",
        _("Can validate applications in the unit"),
    )
    CAN_ALLOCATE_APPLICATIONS = (
        "can_allocate_applications",
        _("Can allocate application in the unit"),
    )
    CAN_HANDLE_APPLICATIONS = (
        "can_handle_applications",
        _("Can handle application in the unit"),
    )
    CAN_MANAGE_UNITS = (
        "can_manage_units",
        _("Can edit unit information"),
    )
    CAN_MANAGE_SPACES = (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the unit"),
    )
    CAN_MANAGE_RESOURCES = (
        "can_manage_resources",
        _("Can create, edit and delete resources in the given unit"),
    )
    CAN_CREATE_STAFF_RESERVATIONS = (
        "can_create_staff_reservations",
        _("Can create staff reservations in the given unit"),
    )
    CAN_COMMENT_RESERVATIONS = (
        "can_comment_reservations",
        _("Can comment reservations in the unit"),
    )


class UnitRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

    # Translated field hints
    verbose_name_fi: str | None
    verbose_name_sv: str | None
    verbose_name_en: str | None

    class Meta:
        db_table = "unit_role_choice"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return self.verbose_name


class UnitRolePermission(models.Model):
    role = models.ForeignKey(
        UnitRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"),
        max_length=255,
        choices=UnitPermissionChoices.choices,
    )

    class Meta:
        db_table = "unit_role_permission"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"UnitRolePermission {self.role.verbose_name} ({self.permission})"


class UnitRole(BaseRole):
    role = models.ForeignKey(UnitRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE)

    unit_group = models.ManyToManyField(
        UnitGroup,
        verbose_name=_("Unit group"),
        related_name="roles",
        blank=True,
    )
    unit = models.ManyToManyField(
        Unit,
        verbose_name=_("Unit"),
        related_name="roles",
        blank=True,
    )
    user = models.ForeignKey(
        "users.User",
        verbose_name=_("User"),
        related_name="unit_roles",
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "unit_role"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"


# Service sector


class ServiceSectorPermissionsChoices(models.TextChoices):
    CAN_MANAGE_SERVICE_SECTOR_ROLES = (
        "can_manage_service_sector_roles",
        _("Can modify roles for the service sector"),
    )
    CAN_MANAGE_UNIT_ROLES = (
        "can_manage_unit_roles",
        _("Can modify roles for units in the service sector"),
    )
    CAN_MANAGE_RESERVATION_UNITS = (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the service sector"),
    )
    CAN_MANAGE_APPLICATION_ROUNDS = (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the service sector"),
    )
    CAN_HANDLE_APPLICATIONS = (
        "can_handle_applications",
        _("Can handle applications in the service sector"),
    )
    CAN_MANAGE_RESERVATIONS = (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the service sector"),
    )
    CAN_VALIDATE_APPLICATIONS = (
        "can_validate_applications",
        _("Can validate application in the service sector"),
    )
    CAN_VIEW_RESERVATIONS = (
        "can_view_reservations",
        _("Can view details of all reservations in the service sector"),
    )
    CAN_VIEW_USERS = (
        "can_view_users",
        _("Can view users in the whole system"),
    )
    CAN_ALLOCATE_APPLICATIONS = (
        "can_allocate_applications",
        _("Can allocate applications in the service sector"),
    )
    CAN_MANAGE_SPACES = (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the service sector"),
    )
    CAN_MANAGE_RESOURCES = (
        "can_manage_resources",
        _("Can create, edit and delete resources in the given service sector"),
    )
    CAN_CREATE_STAFF_RESERVATIONS = (
        "can_create_staff_reservations",
        _("Can create staff reservations in the given service sector"),
    )
    CAN_COMMENT_RESERVATIONS = (
        "can_comment_reservations",
        _("Can comment reservations in the service sector"),
    )
    CAN_MANAGE_UNITS = (
        "can_manage_units",
        _("Can edit unit information in the service sector"),
    )


class ServiceSectorRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

    # Translated field hints
    verbose_name_fi: str | None
    verbose_name_sv: str | None
    verbose_name_en: str | None

    class Meta:
        db_table = "service_sector_role_choice"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return self.verbose_name


class ServiceSectorRolePermission(models.Model):
    role = models.ForeignKey(
        ServiceSectorRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"),
        max_length=255,
        choices=ServiceSectorPermissionsChoices.choices,
    )

    class Meta:
        db_table = "service_sector_role_permission"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"ServiceSectorRolePermission {self.role.verbose_name} ({self.permission})"


class ServiceSectorRole(BaseRole):
    role = models.ForeignKey(ServiceSectorRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE)

    service_sector = models.ForeignKey(
        ServiceSector,
        verbose_name=_("Service sector"),
        related_name="roles",
        on_delete=models.CASCADE,
    )

    user = models.ForeignKey(
        "users.User",
        verbose_name=_("User"),
        related_name="service_sector_roles",
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "service_sector_role"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"
