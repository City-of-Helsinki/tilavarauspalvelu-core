from __future__ import annotations

import contextlib
from functools import cached_property
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.transaction import get_connection
from django.utils.translation import gettext_lazy as _

from utils.sentry import SentryLogger

from .queryset import ReservationUnitHierarchyQuerySet

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

    from .actions import ReservationUnitHierarchyActions

__all__ = [
    "ReservationUnitHierarchy",
]


class ReservationUnitHierarchy(models.Model):
    """
    A PostgreSQL materialized view that is used to pre-calculate
    which reservation units affect a given reservation unit's reservations.

    This view itself is created through a migration.
    See: `0102_create_reservation_unit_hierarchy_materialized_view.py`.
    """

    reservation_unit: ReservationUnit = models.OneToOneField(
        "tilavarauspalvelu.ReservationUnit",
        on_delete=models.DO_NOTHING,
        primary_key=True,
        db_column="reservation_unit_id",
        related_name="reservation_unit_hierarchy",
    )
    related_reservation_unit_ids: list[int] = ArrayField(base_field=models.IntegerField())

    objects = ReservationUnitHierarchyQuerySet.as_manager()

    class Meta:
        managed = False
        db_table = "reservation_unit_hierarchy"
        verbose_name = _("reservation unit hierarchy")
        verbose_name_plural = _("reservation unit hierarchies")
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"Hierarchy for reservation unit: {self.reservation_unit_id}"

    @cached_property
    def actions(self) -> ReservationUnitHierarchyActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitHierarchyActions

        return ReservationUnitHierarchyActions(self)

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

    @classmethod
    @contextlib.contextmanager
    def delay_refresh(cls) -> None:
        """
        Temporarily disables refreshing the materialized view.

        If the view would be refreshed, the refresh is delayed until the end of the context.
        This is helpful when the refresh would otherwise be triggered many times in a short period of time.
        """
        original_refresh = cls.refresh
        should_refresh = False

        def _refresh(*args: Any, **kwargs: Any) -> None:
            nonlocal should_refresh
            should_refresh = True

        try:
            cls.refresh = _refresh
            yield
        finally:
            cls.refresh = original_refresh
            if should_refresh:
                cls.refresh()
