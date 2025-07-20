from __future__ import annotations

from typing import Self

from django.contrib.postgres.aggregates import ArrayAgg
from django.db import models
from django.db.models.functions import Coalesce

from tilavarauspalvelu.models import ApplicationRound, Unit
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ApplicationRoundManager",
    "ApplicationRoundQuerySet",
]


class ApplicationRoundQuerySet(ModelQuerySet[ApplicationRound]):
    def _fetch_all(self) -> None:
        fetch_permissions = "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self.query.annotations
        super()._fetch_all()
        if fetch_permissions:
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        return self.alias(FETCH_UNITS_FOR_PERMISSIONS_FLAG=models.Value(""))

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.

        items = list(self._result_cache)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservation_units__application_rounds__in=items)
            .annotate(
                application_round_ids=Coalesce(
                    ArrayAgg(
                        "reservation_units__application_rounds",
                        distinct=True,
                        filter=(
                            models.Q(reservation_units__isnull=False)
                            & models.Q(reservation_units__application_rounds__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.application_round_ids]

    def active(self) -> Self:
        return self.filter(sent_at=None)


class ApplicationRoundManager(ModelManager[ApplicationRound, ApplicationRoundQuerySet]): ...
