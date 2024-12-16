from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import UserRoleChoice

from .queryset import UnitRoleManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User

    from .actions import UnitRoleActions

__all__ = [
    "UnitRole",
]


class UnitRole(models.Model):
    user: User = models.ForeignKey("tilavarauspalvelu.User", related_name="unit_roles", on_delete=models.CASCADE)
    role: str = StrChoiceField(enum=UserRoleChoice)

    units = models.ManyToManyField("tilavarauspalvelu.Unit", related_name="unit_roles", blank=True)
    unit_groups = models.ManyToManyField("tilavarauspalvelu.UnitGroup", related_name="unit_roles", blank=True)

    assigner: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="assigned_unit_roles",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created: datetime.datetime = models.DateTimeField(auto_now_add=True)
    modified: datetime.datetime = models.DateTimeField(auto_now=True)

    role_active: bool = models.BooleanField(default=True)
    is_from_ad_group: bool = models.BooleanField(default=False)

    objects = UnitRoleManager()

    class Meta:
        db_table = "unit_role"
        base_manager_name = "objects"
        verbose_name = _("unit role")
        verbose_name_plural = _("unit roles")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"Unit Role '{self.role}' for {self.user.first_name} {self.user.last_name} ({self.user.email})"

    @cached_property
    def actions(self) -> UnitRoleActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import UnitRoleActions

        return UnitRoleActions(self)


AuditLogger.register(UnitRole)
