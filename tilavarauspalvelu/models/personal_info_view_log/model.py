from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import PersonalInfoViewLogQuerySet

if TYPE_CHECKING:
    from .actions import PersonalInfoViewLogActions

__all__ = [
    "PersonalInfoViewLog",
]


class PersonalInfoViewLog(models.Model):
    field = models.CharField(max_length=255, null=False, blank=False, editable=False)
    user = models.ForeignKey(
        "tilavarauspalvelu.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="personal_info_view_logs",
        editable=False,
    )
    viewer_username = models.CharField(max_length=255)
    viewer_user = models.ForeignKey(
        "tilavarauspalvelu.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="as_viewer_personal_info_view_logs",
        editable=False,
    )
    access_time = models.DateTimeField(auto_now=True, editable=False)
    viewer_user_email = models.CharField(max_length=255, default="", blank=True)
    viewer_user_full_name = models.CharField(max_length=255, default="", blank=True)

    objects = PersonalInfoViewLogQuerySet.as_manager()

    class Meta:
        db_table = "personal_info_view_log"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.viewer_username} viewed {self.user}'s {self.field} at {self.access_time}"

    @cached_property
    def actions(self) -> PersonalInfoViewLogActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PersonalInfoViewLogActions

        return PersonalInfoViewLogActions(self)
