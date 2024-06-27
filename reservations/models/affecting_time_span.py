from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING

from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from common.date_utils import DEFAULT_TIMEZONE, timedelta_to_json
from opening_hours.utils.time_span_element import TimeSpanElement
from reservations.querysets import AffectingTimeSpanQuerySet

if TYPE_CHECKING:
    import datetime

    from reservations.models import Reservation


__all__ = [
    "AffectingTimeSpan",
]


class AffectingTimeSpan(models.Model):
    """
    A PostgreSQL materialized view that is used to cache reservations as time spans
    for first reservable time calculation. Only future reservations are cached,
    and only reservations that are actually going to occur.

    View contains an array of reservation unit ids that the time span affects, so it is possible
    to query things like "Give me all time spans that affect reservation units X, Y, and Z".

    This view itself is created through a migration (See: `0073_affectingtimespan.py`.),
    and updated through a scheduled task (See `update_affecting_time_spans_task`).
    """

    reservation: Reservation = models.OneToOneField(
        "reservations.Reservation",
        on_delete=models.DO_NOTHING,
        primary_key=True,
        db_column="reservation_id",
        related_name="affecting_time_span",
    )

    affected_reservation_unit_ids: list[int] = ArrayField(base_field=models.IntegerField())
    buffered_start_datetime: datetime.datetime = models.DateTimeField()
    buffered_end_datetime: datetime.datetime = models.DateTimeField()
    is_blocking: bool = models.BooleanField()
    buffer_time_before: datetime.timedelta = models.DurationField()
    buffer_time_after: datetime.timedelta = models.DurationField()

    objects = AffectingTimeSpanQuerySet.as_manager()

    class Meta:
        managed = False
        db_table = "affecting_time_spans"
        verbose_name = _("affecting time span")
        verbose_name_plural = _("affecting time spans")
        base_manager_name = "objects"
        ordering = [
            "buffered_start_datetime",
            "reservation_id",
        ]

    def __str__(self) -> str:
        return self.__repr__()

    def __repr__(self) -> str:
        start_buffered = self.buffered_start_datetime.astimezone(DEFAULT_TIMEZONE).replace(tzinfo=None)
        end_buffered = self.buffered_end_datetime.astimezone(DEFAULT_TIMEZONE).replace(tzinfo=None)

        start = start_buffered + self.buffer_time_before
        end = end_buffered - self.buffer_time_after

        start_str = start.strftime("%Y-%m-%d %H:%M")
        end_str = end.strftime("%H:%M") if end.date() == start.date() else end.strftime("%Y-%m-%d %H:%M")

        duration_str = f"{start_str}-{end_str}"

        if self.buffer_time_before:
            duration_str += f", -{timedelta_to_json(self.buffer_time_before, timespec='minutes')}"
        if self.buffer_time_after:
            duration_str += f", +{timedelta_to_json(self.buffer_time_after, timespec='minutes')}"

        return f"<AffectingTimeSpan({duration_str})>"

    @classmethod
    def refresh(cls, using: str | None = None) -> None:
        """
        Called to refresh the contents of the materialized view.

        The view gets stale quite often, since it's dependent on current time and reservations.
        Therefore, this is used as a sort of cache, which is updated as a scheduled task,
        but can also be called manually if needed.
        """
        with get_connection(using).cursor() as cursor:
            cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY affecting_time_spans")

    @classmethod
    @contextlib.contextmanager
    def refresh_at_the_end(cls) -> None:
        """Refresh the materialized view at the end of the context."""
        try:
            yield
        finally:
            cls.refresh()

    def as_time_span_element(self) -> TimeSpanElement:
        return TimeSpanElement(
            start_datetime=self.buffered_start_datetime + self.buffer_time_before,
            end_datetime=self.buffered_end_datetime - self.buffer_time_after,
            is_reservable=False,
            # Buffers are ignored for blocking reservation even if set.
            buffer_time_before=None if self.is_blocking else self.buffer_time_before,
            buffer_time_after=None if self.is_blocking else self.buffer_time_after,
        )
