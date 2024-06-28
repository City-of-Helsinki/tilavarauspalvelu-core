from typing import Self

from django.db import models

__all__ = [
    "AffectingTimeSpanQuerySet",
]


class AffectingTimeSpanQuerySet(models.QuerySet):
    def for_reservation_units(self, ids: list[int]) -> Self:
        # TODO: Use subquery instead? Avoids "too-many-params" error.
        return self.filter(affected_reservation_unit_ids__overlap=ids)
