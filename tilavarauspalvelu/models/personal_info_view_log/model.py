from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import PersonalInfoViewLogManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import User

    from .actions import PersonalInfoViewLogActions

__all__ = [
    "PersonalInfoViewLog",
]


class PersonalInfoViewLog(models.Model):
    field: str = models.CharField(max_length=255, null=False, blank=False, editable=False)

    viewer_username: str = models.CharField(max_length=255)
    viewer_user_email: str = models.CharField(max_length=255, default="", blank=True)
    viewer_user_full_name: str = models.CharField(max_length=255, default="", blank=True)

    access_time: datetime.datetime = models.DateTimeField(auto_now=True, editable=False)

    user: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="personal_info_view_logs",
        on_delete=models.SET_NULL,
        null=True,
        editable=False,
    )
    viewer_user: User | None = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="as_viewer_personal_info_view_logs",
        on_delete=models.SET_NULL,
        null=True,
        editable=False,
    )

    objects = PersonalInfoViewLogManager()

    class Meta:
        db_table = "personal_info_view_log"
        base_manager_name = "objects"
        verbose_name = _("personal info view log")
        verbose_name_plural = _("personal info view logs")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.viewer_username} viewed {self.user}'s {self.field} at {self.access_time}"

    @cached_property
    def actions(self) -> PersonalInfoViewLogActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PersonalInfoViewLogActions

        return PersonalInfoViewLogActions(self)
