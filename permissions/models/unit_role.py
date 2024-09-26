from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from config.utils.auditlog_util import AuditLogger
from permissions.enums import UserRoleChoice
from permissions.models import GeneralRole

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User

__all__ = [
    "UnitRole",
]


class UnitRole(models.Model):
    user: User = models.ForeignKey("tilavarauspalvelu.User", related_name="unit_roles", on_delete=models.CASCADE)
    role: str = StrChoiceField(enum=UserRoleChoice)

    units = models.ManyToManyField("spaces.Unit", related_name="unit_roles", blank=True)
    unit_groups = models.ManyToManyField("spaces.UnitGroup", related_name="unit_roles", blank=True)

    assigner: User | None = models.ForeignKey(
        "tilavarauspalvelu.User", on_delete=models.SET_NULL, null=True, blank=True
    )
    created: datetime.datetime = models.DateTimeField(auto_now_add=True)
    modified: datetime.datetime = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unit_role"
        base_manager_name = "objects"
        verbose_name = _("Unit role")
        verbose_name_plural = _("Unit roles")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"Unit Role '{self.role}' for {self.user.first_name} {self.user.last_name} ({self.user.email})"


AuditLogger.register(GeneralRole)
