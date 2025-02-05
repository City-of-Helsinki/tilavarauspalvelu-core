from __future__ import annotations

import re
from functools import cached_property
from typing import TYPE_CHECKING

import sqlparse
from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import SQLLogManager

if TYPE_CHECKING:
    from .actions import SQLLogActions

__all__ = [
    "SQLLog",
]


class SQLLog(models.Model):
    request_log = models.ForeignKey(
        "tilavarauspalvelu.RequestLog",
        related_name="sql_logs",
        on_delete=models.CASCADE,
        editable=False,
    )

    sql: str = models.TextField(db_index=True, editable=False)
    duration_ns: int = models.PositiveBigIntegerField(editable=False)
    succeeded: bool = models.BooleanField(default=True, editable=False)
    stack_info: str = models.TextField(blank=True, editable=False)

    objects = SQLLogManager()

    class Meta:
        db_table = "sql_log"
        base_manager_name = "objects"
        verbose_name = _("SQL log")
        verbose_name_plural = _("SQL logs")
        ordering = ["pk"]

    def __str__(self) -> str:
        return _("SQL log") + f" ({self.duration_str} ms)"

    @cached_property
    def actions(self) -> SQLLogActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import SQLLogActions

        return SQLLogActions(self)

    @property
    def duration_str(self) -> str:
        value = self.duration_ns / 1_000_000
        return f"~{value:_.2f}".replace("_", " ")

    @property
    def sql_formatted(self) -> str:
        """Format SQL for readability."""
        # Remove excessive parameter placeholders for clarity.
        sql = re.sub(r"[(\[]%s,?\s?(%s,?\s?)+[])]", "(%s, ...)", self.sql)
        return sqlparse.format(sql, reindent=True, keyword_case="upper")
