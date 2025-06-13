from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

    from .actions import ReservationUnitHierarchyActions
    from .queryset import ReservationUnitHierarchyManager
    from .validators import ReservationUnitHierarchyValidator

__all__ = [
    "ReservationUnitHierarchy",
]


class ReservationUnitHierarchy(models.Model):
    """
    A PostgreSQL materialized view that is used to pre-calculate
    which reservation units affect a given reservation unit's reservations.
    """

    reservation_unit: ReservationUnit = models.OneToOneField(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_unit_hierarchy",
        on_delete=models.DO_NOTHING,
        primary_key=True,
        db_column="reservation_unit_id",
    )
    related_reservation_unit_ids: list[int] = ArrayField(base_field=models.IntegerField())

    objects: ClassVar[ReservationUnitHierarchyManager] = LazyModelManager.new()
    actions: ReservationUnitHierarchyActions = LazyModelAttribute.new()
    validators: ReservationUnitHierarchyValidator = LazyModelAttribute.new()

    class Meta:
        managed = False
        db_table = "reservation_unit_hierarchy"
        base_manager_name = "objects"
        verbose_name = _("reservation unit hierarchy")
        verbose_name_plural = _("reservation unit hierarchies")

    def __str__(self) -> str:
        return f"Hierarchy for reservation unit: {self.reservation_unit_id}"

    @classmethod
    def refresh(cls, using: str | None = None) -> None:
        """
        Called to refresh the contents of the materialized view.

        The view gets stale when:
          1) Reservation units are created or deleted.
          2) Spaces or resources are added to or removed from existing reservation units.
          3) The space hierarchy is changed.

        This method is called automatically with appropriate signals,
        and with a scheduled task, but can also be called manually if needed.
        """
        try:
            with get_connection(using).cursor() as cursor:
                cursor.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY reservation_unit_hierarchy")
        except Exception as error:
            # Only raise error in local development, otherwise log to Sentry
            if settings.RAISE_ERROR_ON_REFRESH_FAILURE:
                raise
            SentryLogger.log_exception(error, details="Failed to refresh materialized view.")
