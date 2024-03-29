from django.db import models
from django.utils.translation import gettext_lazy as _

from permissions.base_models import BaseRole
from spaces.models import ServiceSector, Unit, UnitGroup

__all__ = [
    "GeneralRole",
    "GeneralRoleChoice",
    "GeneralRolePermission",
    "ServiceSectorRole",
    "ServiceSectorRoleChoice",
    "ServiceSectorRolePermission",
    "UnitRole",
    "UnitRoleChoice",
    "UnitRolePermission",
]


GENERAL_PERMISSIONS = (
    (
        "can_manage_general_roles",
        _("Can manage general roles for the whole system"),
    ),
    (
        "can_manage_service_sector_roles",
        _("Can manage roles for service sectors for the whole system"),
    ),
    (
        "can_manage_unit_roles",
        _("Can manage roles for units in the whole system"),
    ),
    (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the whole system"),
    ),
    (
        "can_manage_purposes",
        _("Can create, edit and delete purposes in the whole system"),
    ),
    (
        "can_manage_reservation_purposes",
        _("Can create, edit and delete reservation purposes in the whole system"),
    ),
    (
        "can_manage_age_groups",
        _("Can create, edit and delete age groups in the whole system"),
    ),
    (
        "can_manage_ability_groups",
        _("Can create, edit and delete ability groups in the whole system"),
    ),
    (
        "can_manage_reservation_unit_types",
        _("Can create, edit and delete reservation unit types in the whole system"),
    ),
    (
        "can_manage_equipment_categories",
        _("Can create, edit and delete equipment_categories in the whole system"),
    ),
    (
        "can_manage_equipment",
        _("Can create, edit and delete equipment in the whole system"),
    ),
    (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the whole system"),
    ),
    (
        "can_view_reservations",
        _("Can view details of all reservations in the whole system"),
    ),
    (
        "can_manage_resources",
        _("Can create, edit and delete resources in the whole system"),
    ),
    (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the whole system"),
    ),
    (
        "can_handle_applications",
        _("Can handle applications in the whole system"),
    ),
    (
        "can_validate_applications",
        _("Can validate applications in the whole system"),
    ),
    (
        "can_allocate_applications",
        _("Can allocate applications in the whole system"),
    ),
    (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the whole system"),
    ),
    (
        "can_view_users",
        _("Can view users in the whole system"),
    ),
    (
        "can_comment_reservations",
        _("Can comment reservations in the whole system"),
    ),
    (
        "can_create_staff_reservations",
        _("Can create staff reservations in the whole system"),
    ),
    (
        "can_manage_units",
        _("Can edit unit information in the whole system"),
    ),
    (
        "can_manage_notifications",
        _("Can create, edit and delete banner notifications in the whole system"),
    ),
)

UNIT_PERMISSIONS = (
    (
        "can_manage_unit_roles",
        _("Can modify roles for the unit"),
    ),
    (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the unit"),
    ),
    (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the unit"),
    ),
    (
        "can_view_reservations",
        _("Can view details of all reservations in the unit"),
    ),
    (
        "can_view_users",
        _("Can view users in the whole system"),
    ),
    (
        "can_allocate_applications",
        _("Can allocate applications"),
    ),
    (
        "can_validate_applications",
        _("Can validate applications in the unit"),
    ),
    (
        "can_allocate_applications",
        _("Can allocate application in the unit"),
    ),
    (
        "can_handle_applications",
        _("Can handle application in the unit"),
    ),
    (
        "can_manage_units",
        _("Can edit unit information"),
    ),
    (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the unit"),
    ),
    (
        "can_manage_resources",
        _("Can create, edit and delete resources in the given unit"),
    ),
    (
        "can_create_staff_reservations",
        _("Can create staff reservations in the given unit"),
    ),
    (
        "can_comment_reservations",
        _("Can comment reservations in the unit"),
    ),
)

SERVICE_SECTOR_PERMISSIONS = (
    (
        "can_manage_service_sector_roles",
        _("Can modify roles for the service sector"),
    ),
    (
        "can_manage_unit_roles",
        _("Can modify roles for units in the service sector"),
    ),
    (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the service sector"),
    ),
    (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the service sector"),
    ),
    (
        "can_handle_applications",
        _("Can handle applications in the service sector"),
    ),
    (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the service sector"),
    ),
    (
        "can_validate_applications",
        _("Can validate application in the service sector"),
    ),
    (
        "can_view_reservations",
        _("Can view details of all reservations in the service sector"),
    ),
    (
        "can_view_users",
        _("Can view users in the whole system"),
    ),
    (
        "can_allocate_applications",
        _("Can allocate applications in the service sector"),
    ),
    (
        "can_manage_spaces",
        _("Can create, edit and delete spaces in the service sector"),
    ),
    (
        "can_manage_resources",
        _("Can create, edit and delete resources in the given service sector"),
    ),
    (
        "can_create_staff_reservations",
        _("Can create staff reservations in the given service sector"),
    ),
    (
        "can_comment_reservations",
        _("Can comment reservations in the service sector"),
    ),
    (
        "can_manage_units",
        _("Can edit unit information in the service sector"),
    ),
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

    def __str__(self):
        return self.verbose_name


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

    def __str__(self):
        return self.verbose_name


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

    def __str__(self):
        return self.verbose_name


class ServiceSectorRolePermission(models.Model):
    role = models.ForeignKey(
        ServiceSectorRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(verbose_name=_("Permission"), max_length=255, choices=SERVICE_SECTOR_PERMISSIONS)

    class Meta:
        db_table = "service_sector_role_permission"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"ServiceSectorRolePermission {self.role.verbose_name} ({self.permission})"


class UnitRolePermission(models.Model):
    role = models.ForeignKey(
        UnitRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(verbose_name=_("Permission"), max_length=255, choices=UNIT_PERMISSIONS)

    class Meta:
        db_table = "unit_role_permission"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"UnitRolePermission {self.role.verbose_name} ({self.permission})"


class GeneralRolePermission(models.Model):
    role = models.ForeignKey(
        GeneralRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(verbose_name=_("Permission"), max_length=255, choices=GENERAL_PERMISSIONS)

    class Meta:
        db_table = "general_role_permission"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"GeneralRolePermission {self.role.verbose_name} ({self.permission})"


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

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"


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

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"


class GeneralRole(BaseRole):
    role = models.ForeignKey(GeneralRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE)
    user = models.ForeignKey(
        "users.User",
        verbose_name=_("User"),
        related_name="general_roles",
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = "general_role"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.role.verbose_name} ({self.user.email})"
