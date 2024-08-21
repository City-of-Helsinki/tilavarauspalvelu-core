from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.contrib.postgres.aggregates import ArrayAgg
from django.db import models
from django.db.models import QuerySet
from django.db.models.functions import Coalesce

if TYPE_CHECKING:
    from applications.models import ApplicationRound


class ApplicationRoundQuerySet(QuerySet):
    def active(self) -> Self:
        return self.filter(sent_date=None)

    def _fetch_all(self) -> None:
        super()._fetch_all()
        if "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self._hints:
            self._hints.pop("FETCH_UNITS_FOR_PERMISSIONS_FLAG", None)
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        self._hints["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = True
        return self

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.
        from spaces.models import Unit

        items: list[ApplicationRound] = list(self)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservationunit__application_rounds__in=items)
            .annotate(
                application_round_ids=Coalesce(
                    ArrayAgg(
                        "reservationunit__application_rounds",
                        distinct=True,
                        filter=(
                            models.Q(reservationunit__isnull=False)
                            & models.Q(reservationunit__application_rounds__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.application_round_ids]
