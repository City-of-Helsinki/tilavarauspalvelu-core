from __future__ import annotations

from typing import Literal, Self

from django.db import models

from utils.db import SubqueryCount

__all__ = [
    "UnitManager",
    "UnitQuerySet",
]


class UnitQuerySet(models.QuerySet):
    def order_by_unit_group_name(self, *, language: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        from tilavarauspalvelu.models import UnitGroup

        return self.alias(**{
            f"unit_group_name_{language}": models.Subquery(
                queryset=(
                    # Use the name of the linked unit group which is first alphabetically
                    UnitGroup.objects.filter(units=models.OuterRef("pk"))
                    .order_by(f"name_{language}")
                    .values(f"name_{language}")[:1]
                ),
            )
        }).order_by(models.OrderBy(models.F(f"unit_group_name_{language}"), descending=desc))

    def order_by_reservation_units_count(self, *, desc: bool = False) -> Self:
        from tilavarauspalvelu.models import ReservationUnit

        return self.alias(
            reservation_units_count=SubqueryCount(
                ReservationUnit.objects.filter(unit=models.OuterRef("pk"), is_archived=False).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_units_count"), descending=desc))

    def order_by_reservation_count(self, *, desc: bool = False) -> Self:
        from tilavarauspalvelu.models import Reservation

        return self.alias(
            reservation_count=SubqueryCount(
                Reservation.objects.filter(reservation_units__unit=models.OuterRef("pk")).values("id"),
            ),
        ).order_by(models.OrderBy(models.F("reservation_count"), descending=desc))


class UnitManager(models.Manager.from_queryset(UnitQuerySet)): ...
