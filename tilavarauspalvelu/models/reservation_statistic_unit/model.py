from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models, transaction
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationStatisticsReservationUnitManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationStatistic

    from .actions import ReservationStatisticsReservationUnitActions


__all__ = [
    "ReservationStatisticsReservationUnit",
]


class ReservationStatisticsReservationUnit(models.Model):
    name = models.CharField(max_length=255)
    unit_name = models.CharField(max_length=255)
    unit_tprek_id = models.CharField(max_length=255, null=True)

    reservation_statistics = models.ForeignKey(
        "tilavarauspalvelu.ReservationStatistic",
        related_name="reservation_stats_reservation_units",
        on_delete=models.CASCADE,
    )
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_stats_reservation_units",
        on_delete=models.SET_NULL,
        null=True,
    )

    objects = ReservationStatisticsReservationUnitManager()

    class Meta:
        db_table = "reservation_statistics_reservation_unit"
        base_manager_name = "objects"
        verbose_name = _("reservation statistics reservation unit")
        verbose_name_plural = _("reservation statistics reservation units")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.reservation_statistics} - {self.reservation_unit}"

    @cached_property
    def actions(self) -> ReservationStatisticsReservationUnitActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationStatisticsReservationUnitActions

        return ReservationStatisticsReservationUnitActions(self)

    @classmethod
    def for_statistic(
        cls,
        statistic: ReservationStatistic,
        *,
        save: bool = True,
    ) -> list[ReservationStatisticsReservationUnit]:
        to_save: list[ReservationStatisticsReservationUnit] = []
        for reservation_unit in statistic.reservation.reservation_units.all():
            stat_unit = ReservationStatisticsReservationUnit(
                reservation_statistics=statistic,
                reservation_unit=reservation_unit,
            )

            stat_unit.name = reservation_unit.name
            stat_unit.reservation_statistics = statistic
            stat_unit.reservation_unit = reservation_unit
            stat_unit.unit_name = getattr(reservation_unit.unit, "name", "")
            stat_unit.unit_tprek_id = getattr(reservation_unit.unit, "tprek_id", "")

            to_save.append(stat_unit)

        if save:
            with transaction.atomic():
                ReservationStatisticsReservationUnit.objects.filter(reservation_statistics=statistic).delete()
                ReservationStatisticsReservationUnit.objects.bulk_create(to_save)

        return to_save
