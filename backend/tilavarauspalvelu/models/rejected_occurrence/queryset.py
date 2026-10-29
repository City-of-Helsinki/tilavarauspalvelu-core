from __future__ import annotations

from typing import Self, TypeVar

from lookup_property import L

from tilavarauspalvelu.models import RejectedOccurrence
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "RejectedOccurrenceManager",
    "RejectedOccurrenceQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=RejectedOccurrence, covariant=True, default=RejectedOccurrence)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=RejectedOccurrence)


class RejectedOccurrenceQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
    def order_by_applicant(self, *, desc: bool = False) -> Self:
        applicant_ref = (
            "reservation_series"
            "__allocated_time_slot"
            "__reservation_unit_option"
            "__application_section"
            "__application"
            "__applicant"
        )
        return self.order_by(L(applicant_ref).order_by(descending=desc))

    def order_by_rejection_reason(self, *, desc: bool = False) -> Self:
        return self.order_by(L("rejection_reason_sort_order").order_by(descending=desc))


class RejectedOccurrenceManager(ModelManager[RejectedOccurrence, RejectedOccurrenceQuerySet]): ...
