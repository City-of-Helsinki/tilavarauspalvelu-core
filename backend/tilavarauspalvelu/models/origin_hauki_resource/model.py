from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from utils.date_utils import local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservableTimeSpan, ReservationUnit, Unit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservable_time_span.queryset import ReservableTimeSpanQuerySet
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet

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
    latest_fetched_date: datetime.datetime.date | None = models.DateField(null=True, blank=True)

    objects: ClassVar[OriginHaukiResourceManager] = LazyModelManager.new()
    actions: OriginHaukiResourceActions = LazyModelAttribute.new()
    validators: OriginHaukiResourceValidator = LazyModelAttribute.new()

    reservable_time_spans: OneToManyRelatedManager[ReservableTimeSpan, ReservableTimeSpanQuerySet]
    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]
    units: OneToManyRelatedManager[Unit, UnitQuerySet]

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
