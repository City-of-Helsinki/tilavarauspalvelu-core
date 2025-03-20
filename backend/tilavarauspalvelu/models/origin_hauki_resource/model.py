from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.date_utils import local_date, local_start_of_day
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import OriginHaukiResourceActions
    from .queryset import OriginHaukiResourceManager
    from .validators import OriginHaukiResourceValidator


__all__ = [
    "OriginHaukiResource",
]


class OriginHaukiResource(models.Model):
    # Resource id in Hauki API
    id: int = models.IntegerField(unique=True, primary_key=True)
    # Hauki API hash for opening hours, which is used to determine if the opening hours have changed
    opening_hours_hash: str = models.CharField(max_length=64, blank=True)
    # Latest date fetched from Hauki opening hours API (NOT when the data was last updated)
    latest_fetched_date: datetime.datetime.date = models.DateField(blank=True, null=True)

    objects: ClassVar[OriginHaukiResourceManager] = LazyModelManager.new()
    actions: OriginHaukiResourceActions = LazyModelAttribute.new()
    validators: OriginHaukiResourceValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "origin_hauki_resource"
        base_manager_name = "objects"
        verbose_name = _("origin hauki resource")
        verbose_name_plural = _("origin hauki resources")
        ordering = ["pk"]

    def __str__(self) -> str:
        return str(self.id)

    @property
    def should_update_opening_hours(self) -> bool:
        """Return True if the opening hours should be updated from Hauki API."""
        return (
            not self.opening_hours_hash
            or self.latest_fetched_date is None
            or self.latest_fetched_date < (local_date() + datetime.timedelta(days=settings.HAUKI_DAYS_TO_FETCH))
        )

    def update_opening_hours_hash(self, new_date_periods_hash: str) -> None:
        """
        Update the opening hours hash and clear all future ReservableTimeSpans.

        When the hash has changed in HAUKI, it means that the rules for generating reservable times have changed,
        meaning all future ReservableTimeSpans are now invalid and should be deleted and be recreated.
        """
        self.opening_hours_hash = new_date_periods_hash
        self.latest_fetched_date = None  # Set to None, to clarify that all future data is missing
        self.save()

        cutoff_date = local_date()  # All ReservableTimeSpans that start after this date will be deleted.

        # Old time spans are not deleted, as they are kept for archival purposes.
        self.reservable_time_spans.filter(start_datetime__gte=cutoff_date).delete()

        # If the cutoff_date is during a ReservableTimeSpan, end it at the cutoff date.
        # This way we can keep past data intact, and have the new data start from the cutoff date.
        self.reservable_time_spans.filter(end_datetime__gte=cutoff_date).update(end_datetime=local_start_of_day())
