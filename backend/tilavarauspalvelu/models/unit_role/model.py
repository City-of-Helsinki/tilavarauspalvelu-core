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

    from .actions import UnitRoleActions
    from .queryset import UnitRoleManager
    from .validators import UnitRoleValidator

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
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)
    updated_at: datetime.datetime = models.DateTimeField(auto_now=True)

    is_role_active: bool = models.BooleanField(default=True)
    is_from_ad_group: bool = models.BooleanField(default=False)

    objects: ClassVar[UnitRoleManager] = LazyModelManager.new()
    actions: UnitRoleActions = LazyModelAttribute.new()
    validators: UnitRoleValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "unit_role"
        base_manager_name = "objects"
        verbose_name = _("unit role")
        verbose_name_plural = _("unit roles")
        ordering = ["pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["role", "user"],
                name="unique_role_user_if_is_from_ad_group",
                condition=models.Q(is_from_ad_group=True),
                violation_error_message="Role for user must be unique for AD group based roles.",
            ),
        ]

    def __str__(self) -> str:
        return f"Unit Role '{self.role}' for {self.user.first_name} {self.user.last_name} ({self.user.email})"


AuditLogger.register(UnitRole)
