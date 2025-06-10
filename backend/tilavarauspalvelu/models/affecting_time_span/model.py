from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar
from warnings import deprecated

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.cache import cache
from django.db import models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, timedelta_to_json
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement
    from tilavarauspalvelu.models import Reservation

    from .actions import AffectingTimeSpanActions
    from .queryset import AffectingTimeSpanManager
    from .validators import AffectingTimeSpanValidator


@deprecated("REFACTOR: Should just use on-demand calculation to avoid overlapping reservations")
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

    objects: ClassVar[AffectingTimeSpanManager] = LazyModelManager.new()
    actions: AffectingTimeSpanActions = LazyModelAttribute.new()
    validators: AffectingTimeSpanValidator = LazyModelAttribute.new()

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
        from tilavarauspalvelu.integrations.opening_hours.time_span_element import TimeSpanElement

        return TimeSpanElement(
            start_datetime=self.buffered_start_datetime + self.buffer_time_before,
            end_datetime=self.buffered_end_datetime - self.buffer_time_after,
            is_reservable=False,
            # Buffers are ignored for blocking reservation even if set.
            buffer_time_before=None if self.is_blocking else self.buffer_time_before,
            buffer_time_after=None if self.is_blocking else self.buffer_time_after,
        )
