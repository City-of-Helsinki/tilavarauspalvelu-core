from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import UserRoleChoice
from utils.auditlog_util import AuditLogger
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    import datetime

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import User

    from .actions import GeneralRoleActions
    from .queryset import GeneralRoleManager
    from .validators import GeneralRoleValidator


__all__ = [
    "GeneralRole",
]


class GeneralRole(models.Model):
    user: User = models.ForeignKey("tilavarauspalvelu.User", related_name="general_roles", on_delete=models.CASCADE)  # type: ignore[assignment]
    role: UserRoleChoice = TextChoicesField(enum=UserRoleChoice)  # type: ignore[assignment]

    assigner: User | None = models.ForeignKey(  # type: ignore[assignment]
        "tilavarauspalvelu.User",
        related_name="assigned_general_roles",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)  # type: ignore[assignment]
    updated_at: datetime.datetime = models.DateTimeField(auto_now=True)  # type: ignore[assignment]

    is_role_active: bool = models.BooleanField(default=True)  # type: ignore[assignment]

    objects: ClassVar[GeneralRoleManager] = LazyModelManager.new()
    actions: LazyAttribute[GeneralRoleActions] = LazyModelAttribute.new()
    validators: LazyAttribute[GeneralRoleValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "general_role"
        base_manager_name = "objects"
        verbose_name = _("general role")
        verbose_name_plural = _("general roles")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"General Role '{self.role}' for {self.user.first_name} {self.user.last_name} ({self.user.email})"


AuditLogger.register(GeneralRole)
