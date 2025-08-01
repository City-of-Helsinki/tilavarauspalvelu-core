from __future__ import annotations

from typing import Literal, Self

from django.db import models

from tilavarauspalvelu.models import Reservation, ReservationUnit, Unit
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.db import SubqueryCount

__all__ = [
    "UnitManager",
    "UnitQuerySet",
]


class UnitQuerySet(ModelQuerySet[Unit]):
    def order_by_unit_group_name(self, *, language: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.alias().order_by(models.OrderBy(models.F(f"unit_group_name_{language}"), descending=desc))

    def order_by_reservation_units_count(self, *, desc: bool = False) -> Self:
        return self.alias(
            reservation_units_count=SubqueryCount(
                ReservationUnit.objects.filter(unit=models.OuterRef("pk"), is_archived=False).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_units_count"), descending=desc))

    def order_by_reservation_count(self, *, desc: bool = False) -> Self:
        return self.alias(
            reservation_count=SubqueryCount(
                Reservation.objects.filter(reservation_unit__unit=models.OuterRef("pk")).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_count"), descending=desc))


class UnitManager(ModelManager[Unit, UnitQuerySet]): ...
