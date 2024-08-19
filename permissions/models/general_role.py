from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from permissions.enums import UserRoleChoice
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    import datetime

    from users.models import User


__all__ = [
    "GeneralRole",
]


class GeneralRole(models.Model):
    user: User = models.ForeignKey("users.User", related_name="general_roles", on_delete=models.CASCADE)
    role: str = StrChoiceField(enum=UserRoleChoice)

    assigner: User | None = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)
    created: datetime.datetime = models.DateTimeField(auto_now_add=True)
    modified: datetime.datetime = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "general_role"
        base_manager_name = "objects"
        verbose_name = _("General role")
        verbose_name_plural = _("General roles")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.role}"


AuditLogger.register(GeneralRole)
