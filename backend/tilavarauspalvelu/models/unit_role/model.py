from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import UserRoleChoice
from utils.auditlog_util import AuditLogger
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import Unit, UnitGroup
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager
    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet
    from tilavarauspalvelu.models.unit_group.queryset import UnitGroupQuerySet

    from .actions import UnitRoleActions
    from .queryset import UnitRoleManager
    from .validators import UnitRoleValidator

__all__ = [
    "UnitRole",
]


class UnitRole(models.Model):
    user = models.ForeignKey("tilavarauspalvelu.User", related_name="unit_roles", on_delete=models.CASCADE)
    role = TextChoicesField(enum=UserRoleChoice)

    units: ManyToManyRelatedManager[Unit, UnitQuerySet] = models.ManyToManyField(  # type: ignore[assignment]
        "tilavarauspalvelu.Unit",
        related_name="unit_roles",
        blank=True,
    )
    unit_groups: ManyToManyRelatedManager[UnitGroup, UnitGroupQuerySet] = models.ManyToManyField(  # type: ignore[assignment]
        "tilavarauspalvelu.UnitGroup",
        related_name="unit_roles",
        blank=True,
    )

    assigner = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="assigned_unit_roles",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_role_active = models.BooleanField(default=True)
    is_from_ad_group = models.BooleanField(default=False)

    objects: ClassVar[UnitRoleManager] = LazyModelManager.new()
    actions: LazyAttribute[UnitRoleActions] = LazyModelAttribute.new()
    validators: LazyAttribute[UnitRoleValidator] = LazyModelAttribute.new()

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
