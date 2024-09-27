from __future__ import annotations

import uuid
from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import RequestLogQuerySet

if TYPE_CHECKING:
    import datetime

    from .actions import RequestLogActions


__all__ = [
    "RequestLog",
]


class RequestLog(models.Model):
    request_id: uuid.UUID = models.UUIDField(primary_key=True, default=uuid.uuid4)
    path: str = models.TextField(editable=False)
    body: str | None = models.TextField(null=True, blank=True, editable=False)
    duration_ms: int = models.PositiveBigIntegerField(editable=False)
    created: datetime.datetime = models.DateTimeField(auto_now_add=True, editable=False)

    objects = RequestLogQuerySet.as_manager()

    class Meta:
        db_table = "request_log"
        base_manager_name = "objects"
        verbose_name = _("Request log")
        verbose_name_plural = _("Request logs")
        ordering = ["pk"]

    def __str__(self) -> str:
        return _("Request log") + f" '{self.request_id}' ({self.duration_str} ms)"

    @cached_property
    def actions(self) -> RequestLogActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import RequestLogActions

        return RequestLogActions(self)

    @property
    def duration_str(self) -> str:
        return f"~{self.duration_ms:_.2f}".replace("_", " ")
