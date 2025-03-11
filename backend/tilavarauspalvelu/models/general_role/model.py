from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from graphene_django_extensions.fields.model import StrChoiceField

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import UserRoleChoice
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User

    from .actions import GeneralRoleActions
    from .queryset import GeneralRoleManager
    from .validators import GeneralRoleValidator


__all__ = [
    "GeneralRole",
]


class GeneralRole(models.Model):
    user: User = models.ForeignKey("tilavarauspalvelu.User", related_name="general_roles", on_delete=models.CASCADE)
    role: str = StrChoiceField(enum=UserRoleChoice)

    assigner: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="assigned_general_roles",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    created: datetime.datetime = models.DateTimeField(auto_now_add=True)
    modified: datetime.datetime = models.DateTimeField(auto_now=True)

    role_active: bool = models.BooleanField(default=True)

    objects: ClassVar[GeneralRoleManager] = LazyModelManager.new()
    actions: GeneralRoleActions = LazyModelAttribute.new()
    validators: GeneralRoleValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "general_role"
        base_manager_name = "objects"
        verbose_name = _("general role")
        verbose_name_plural = _("general roles")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"General Role '{self.role}' for {self.user.first_name} {self.user.last_name} ({self.user.email})"


AuditLogger.register(GeneralRole)
