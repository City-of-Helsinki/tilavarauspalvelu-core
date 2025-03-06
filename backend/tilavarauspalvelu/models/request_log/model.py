from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    import datetime

    from .actions import RequestLogActions
    from .queryset import RequestLogManager
    from .validators import RequestLogValidator


__all__ = [
    "RequestLog",
]


class RequestLog(models.Model):
    request_id: uuid.UUID = models.UUIDField(primary_key=True, default=uuid.uuid4)
    path: str = models.TextField(editable=False)
    body: str | None = models.TextField(null=True, blank=True, editable=False)
    duration_ms: int = models.PositiveBigIntegerField(editable=False)
    created: datetime.datetime = models.DateTimeField(auto_now_add=True, editable=False)

    objects: ClassVar[RequestLogManager] = LazyModelManager.new()
    actions: RequestLogActions = LazyModelAttribute.new()
    validators: RequestLogValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "request_log"
        base_manager_name = "objects"
        verbose_name = _("request log")
        verbose_name_plural = _("request logs")
        ordering = ["pk"]

    def __str__(self) -> str:
        return _("request log") + f" '{self.request_id}' ({self.duration_str} ms)"

    @property
    def duration_str(self) -> str:
        return f"~{self.duration_ms:_.2f}".replace("_", " ")
