from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from spaces.models import ServiceSector, Unit, UnitGroup

from .base_models import BaseRole

User = get_user_model()

GENERAL_PERMISSIONS = (
    (
        "can_manage_general_roles",
        _("Can manage general roles for the whole system"),
    ),
    (
        "can_manage_service_sector_roles",
        _("Can manage roles for service sectorsfor the whole system"),
    ),
    ("can_manage_unit_roles", _("Can manage roles for units in the whole system")),
    (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in the whole system"),
    ),
    (
        "can_manage_purposes",
        _("Can create, edit and delete purposes in the whole system"),
    ),
    (
        "can_manage_age_groups",
        _("Can create, edit and delete age groups in the whole system"),
    ),
    (
        "can_manage_districts",
        _("Can create, edit and delete districts in the whole system"),
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
        "can_view_reservations",
        _("Can create, edit and delete equipment in the whole system"),
    ),
    (
        "can_manage_reservations",
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
    ("can_handle_applications", _("Can handle applications in the whole system")),
    (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the whole system"),
    ),
    (
        "can_view_users",
        _("Can view users in the whole system"),
    ),
)


UNIT_PERMISSIONS = (
    ("can_manage_unit_roles", _("Can modify roles for the unit")),
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
    ("can_validate_applications", _("Can validate applications")),
)

SERVICE_SECTOR_PERMISSIONS = (
    ("can_manage_service_sector_roles", _("Can modify roles for the service sector")),
    ("can_manage_unit_roles", _("Can modify roles for units in the service sector")),
    (
        "can_manage_reservation_units",
        _("Can create, edit and delete reservation units in certain unit"),
    ),
    (
        "can_manage_application_rounds",
        _("Can create, edit and delete application rounds in the service sector"),
    ),
    ("can_handle_applications", _("Can handle applications in the service sector")),
    (
        "can_manage_reservations",
        _("Can create, edit and cancel reservations in the service sector"),
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
)


class UnitRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

    def __str__(self):
        return self.verbose_name


class ServiceSectorRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

    def __str__(self):
        return self.verbose_name


class GeneralRoleChoice(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=50, primary_key=True)
    verbose_name = models.CharField(verbose_name=_("Verbose name"), max_length=255)

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
        verbose_name=_("Permission"), max_length=255, choices=SERVICE_SECTOR_PERMISSIONS
    )


class UnitRolePermission(models.Model):
    role = models.ForeignKey(
        UnitRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"), max_length=255, choices=UNIT_PERMISSIONS
    )


class GeneralRolePermission(models.Model):
    role = models.ForeignKey(
        GeneralRoleChoice,
        verbose_name=_("Role"),
        related_name="permissions",
        on_delete=models.CASCADE,
    )
    permission = models.CharField(
        verbose_name=_("Permission"), max_length=255, choices=GENERAL_PERMISSIONS
    )


class UnitRole(BaseRole):
    role = models.ForeignKey(
        UnitRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE
    )

    unit_group = models.ForeignKey(
        UnitGroup,
        verbose_name=_("Unit group"),
        related_name="roles",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    unit = models.ForeignKey(
        Unit,
        verbose_name=_("Unit"),
        related_name="roles",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        related_name="unit_roles",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return "{} ({})".format(self.role.verbose_name, self.user.email)


class ServiceSectorRole(BaseRole):
    role = models.ForeignKey(
        ServiceSectorRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE
    )

    service_sector = models.ForeignKey(
        ServiceSector,
        verbose_name=_("Service sector"),
        related_name="roles",
        on_delete=models.CASCADE,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        related_name="service_sector_roles",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return "{} ({})".format(self.role.verbose_name, self.user.email)


class GeneralRole(BaseRole):
    role = models.ForeignKey(
        GeneralRoleChoice, verbose_name=_("Role"), on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        related_name="general_roles",
        on_delete=models.CASCADE,
    )

    def __str__(self):
        return "{} ({})".format(self.role.verbose_name, self.user.email)
