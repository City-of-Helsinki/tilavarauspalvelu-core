from __future__ import annotations

import datetime
from functools import cached_property
from inspect import cleandoc
from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.cache import cache
from django.db import migrations, models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, timedelta_to_json
from utils.sentry import SentryLogger

from .queryset import AffectingTimeSpanManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement

    from .actions import AffectingTimeSpanActions


class AffectingTimeSpan(models.Model):
    """
    A PostgreSQL materialized view that is used to cache reservations as time spans
    for first reservable time calculation. Only future reservations are cached,
    and only reservations that are actually going to occur.

    View contains an array of reservation unit ids that the time span affects, so it is possible
    to query things like "Give me all time spans that affect reservation units X, Y, and Z".
    """

    CACHE_KEY = "affecting_time_spans"
    """Key for storing datetime stamp in cache of when the view was last updated."""

    reservation: Reservation = models.OneToOneField(
        "tilavarauspalvelu.Reservation",
        related_name="affecting_time_span",
        on_delete=models.DO_NOTHING,
        primary_key=True,
        db_column="reservation_id",
    )

    affected_reservation_unit_ids: list[int] = ArrayField(base_field=models.IntegerField())
    buffered_start_datetime: datetime.datetime = models.DateTimeField()
    buffered_end_datetime: datetime.datetime = models.DateTimeField()
    is_blocking: bool = models.BooleanField()
    buffer_time_before: datetime.timedelta = models.DurationField()
    buffer_time_after: datetime.timedelta = models.DurationField()

    objects = AffectingTimeSpanManager()

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

    @cached_property
    def actions(self) -> AffectingTimeSpanActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AffectingTimeSpanActions

        return AffectingTimeSpanActions(self)

    @classmethod
    def refresh(cls, using: str | None = None) -> None:
        """
        Called to refresh the contents of the materialized view.

        The view gets stale quite often, since it's dependent on current time and reservations.
        Therefore, this is used as a sort of cache, which is updated as a scheduled task,
        but can also be called manually if needed.

        Refreshing updated a value in cache that can be used to check if the view is valid.
        """
        try:
            with get_connection(using).cursor() as cursor:
                cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY affecting_time_spans")
        except Exception as error:
            # Only raise error in local development, otherwise log to Sentry
            if settings.RAISE_ERROR_ON_REFRESH_FAILURE:
                raise
            SentryLogger.log_exception(error, details="Failed to refresh materialized view.")
        else:
            last_updated = local_datetime().isoformat()
            max_allowed_age = datetime.timedelta(minutes=settings.AFFECTING_TIME_SPANS_UPDATE_INTERVAL_MINUTES)
            cache.set(cls.CACHE_KEY, last_updated, timeout=max_allowed_age.total_seconds())

    @classmethod
    def is_valid(cls) -> bool:
        """Check last update datetime against a set max allowed age.."""
        cached_value: str | None = cache.get(cls.CACHE_KEY)
        if cached_value is None:
            return False
        last_updated = datetime.datetime.fromisoformat(cached_value)
        max_allowed_age = datetime.timedelta(minutes=settings.AFFECTING_TIME_SPANS_UPDATE_INTERVAL_MINUTES)
        return local_datetime() - last_updated < max_allowed_age

    def as_time_span_element(self) -> TimeSpanElement:
        from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement

        return TimeSpanElement(
            start_datetime=self.buffered_start_datetime + self.buffer_time_before,
            end_datetime=self.buffered_end_datetime - self.buffer_time_after,
            is_reservable=False,
            # Buffers are ignored for blocking reservation even if set.
            buffer_time_before=None if self.is_blocking else self.buffer_time_before,
            buffer_time_after=None if self.is_blocking else self.buffer_time_after,
        )

    # For migrations.

    @classmethod
    def create_migration(cls):
        return migrations.RunSQL(sql=cls.__forward_sql(), reverse_sql=cls.__reverse_sql())

    @classmethod
    def __forward_sql(cls) -> str:
        view_sql = "CREATE MATERIALIZED VIEW affecting_time_spans AS"

        table_sql = cleandoc(
            """
            SELECT
                res.reservation_id,
                array_agg(res.ru_id ORDER BY res.ru_id) AS affected_reservation_unit_ids,
                res.buffered_start_datetime,
                res.buffered_end_datetime,
                res.buffer_time_before,
                res.buffer_time_after,
                res.is_blocking
            FROM (
                SELECT DISTINCT
                    r.id as reservation_id,
                    unnest(ruh.related_reservation_unit_ids) as ru_id,
                    (r.begin - r.buffer_time_before) as buffered_start_datetime,
                    (r.end + r.buffer_time_after) as buffered_end_datetime,
                    r.buffer_time_before as buffer_time_before,
                    r.buffer_time_after as buffer_time_after,
                    (CASE WHEN UPPER(r."type") = 'BLOCKED' THEN true ELSE false END) as is_blocking
                FROM reservation r
                INNER JOIN "reservation_reservation_unit" rru ON r.id = rru.reservation_id
                INNER JOIN "reservation_unit_hierarchy" ruh ON rru.reservationunit_id = ruh.reservation_unit_id
                WHERE (
                    (r.end + r.buffer_time_after)::date >= NOW_TT()::date
                    AND UPPER(r.state) IN ('CREATED', 'CONFIRMED', 'WAITING_FOR_PAYMENT', 'REQUIRES_HANDLING')
                )
            ) res
            GROUP BY
                res.reservation_id,
                res.buffered_start_datetime,
                res.buffered_end_datetime,
                res.buffer_time_before,
                res.buffer_time_after,
                res.is_blocking
            ORDER BY res.buffered_start_datetime, res.reservation_id;
            """
        )

        indexes_sql = cleandoc(
            """
            CREATE UNIQUE INDEX idx_reservation_id ON affecting_time_spans (reservation_id);
            CREATE INDEX idx_affected_reservation_unit_ids on affecting_time_spans USING GIN (
                affected_reservation_unit_ids gin__int_ops
            );
            CREATE INDEX idx_buffered_start_datetime ON affecting_time_spans (buffered_start_datetime);
            CREATE INDEX idx_buffered_end_datetime ON affecting_time_spans (buffered_end_datetime);
            """
        )

        return f"{view_sql}\n{table_sql}\n{indexes_sql}"

    @classmethod
    def __reverse_sql(cls) -> str:
        return """
        DROP INDEX idx_buffered_end_datetime;
        DROP INDEX idx_buffered_start_datetime;
        DROP INDEX idx_affected_reservation_unit_ids;
        DROP INDEX idx_reservation_id;
        DROP MATERIALIZED VIEW affecting_time_spans
        """
