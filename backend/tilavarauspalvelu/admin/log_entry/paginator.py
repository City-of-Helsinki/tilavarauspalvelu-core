from __future__ import annotations

from typing import TYPE_CHECKING

from django.core.paginator import Paginator
from django.utils.functional import cached_property

if TYPE_CHECKING:
    from auditlog.models import LogEntry
    from django.db.models import QuerySet

LOG_ENTRY_COUNT_LIMIT = 10_000


class LogEntryPaginator(Paginator):
    """Count log entries only up to a limit, since counting all of them reads every row in the table."""

    object_list: QuerySet[LogEntry]

    @cached_property
    def count(self) -> int:
        return min(self.limited_count, LOG_ENTRY_COUNT_LIMIT)

    @cached_property
    def is_count_limited(self) -> bool:
        return self.limited_count > LOG_ENTRY_COUNT_LIMIT

    @cached_property
    def limited_count(self) -> int:
        # Count one more than the limit to know if there are more log entries than the limit.
        limited_object_list = self.object_list[: LOG_ENTRY_COUNT_LIMIT + 1]
        return limited_object_list.count()
