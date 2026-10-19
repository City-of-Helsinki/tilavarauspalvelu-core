from __future__ import annotations

from typing import Literal, Self, TypeVar

from django.db import models

from tilavarauspalvelu.models import Reservation, ReservationUnit, Unit, UnitGroup
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet
from utils.db import SubqueryCount

__all__ = [
    "UnitManager",
    "UnitQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=Unit, covariant=True, default=Unit)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=Unit)


class UnitQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]):
    def order_by_unit_group_name(self, *, language: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.alias(**{
            f"unit_group_name_{language}": models.Subquery(
                queryset=(
                    # Use the name of the linked unit group which is first alphabetically
                    UnitGroup.objects
                    .filter(units=models.OuterRef("pk"))
                    .order_by(f"name_{language}")
                    .values(f"name_{language}")[:1]
                ),
            )
        }).order_by(models.OrderBy(models.F(f"unit_group_name_{language}"), descending=desc))

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


class UnitManager(TranslatedModelManager[Unit, UnitQuerySet]): ...
