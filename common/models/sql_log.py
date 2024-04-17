import datetime
import uuid

from django.db import models
from django.utils.translation import gettext_lazy as _

from common.querysets.sql_log import SQLLogQuerySet

__all__ = [
    "SQLLog",
]


class SQLLog(models.Model):
    sql: str = models.TextField(db_index=True, editable=False)
    path: str = models.TextField(editable=False)
    body: str | None = models.TextField(null=True, blank=True, editable=False)
    duration_ns: int = models.PositiveBigIntegerField(editable=False)
    succeeded: bool = models.BooleanField(default=True, editable=False)
    request_id: uuid.UUID = models.UUIDField(editable=False)
    created: datetime.datetime = models.DateTimeField(auto_now_add=True, editable=False)

    objects = SQLLogQuerySet.as_manager()

    class Meta:
        db_table = "sql_log"
        base_manager_name = "objects"
        verbose_name = _("SQL log")
        verbose_name_plural = _("SQL logs")

    def __str__(self) -> str:
        return _("SQL log") + f" [{self.created.isoformat(timespec='seconds')}]"
