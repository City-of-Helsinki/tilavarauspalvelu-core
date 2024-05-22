import datetime
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.querysets.sql_log import RequestLogQuerySet, SQLLogQuerySet

__all__ = [
    "RequestLog",
    "SQLLog",
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

    def __str__(self) -> str:
        return _("Request log") + f" '{self.request_id}' ({self.duration_str} ms)"

    @property
    def duration_str(self) -> str:
        if self.duration_ms:
            return f"{self.duration_ms:_.2f}".replace("_", " ")

        value = self.sql_logs.aggregate(total=models.Sum("duration_ns"))["total"] / 1_000_000
        return f"~{value:_.2f}".replace("_", " ")


class SQLLog(models.Model):
    request_log = models.ForeignKey(RequestLog, on_delete=models.CASCADE, related_name="sql_logs", editable=False)
    sql: str = models.TextField(db_index=True, editable=False)
    duration_ns: int = models.PositiveBigIntegerField(editable=False)
    succeeded: bool = models.BooleanField(default=True, editable=False)

    objects = SQLLogQuerySet.as_manager()

    class Meta:
        db_table = "sql_log"
        base_manager_name = "objects"
        verbose_name = _("SQL log")
        verbose_name_plural = _("SQL logs")

    def __str__(self) -> str:
        return _("SQL log") + f" (~{self.duration_str} ms)"

    @property
    def duration_str(self) -> str:
        value = self.duration_ns / 1_000_000
        return f"{value:_.2f}".replace("_", " ")
