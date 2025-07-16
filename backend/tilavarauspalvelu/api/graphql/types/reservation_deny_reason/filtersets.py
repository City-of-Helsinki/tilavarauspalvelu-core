from __future__ import annotations

from django.db import models

from tilavarauspalvelu.models import ReservationDenyReason

__all__ = [
    "ReservationDenyReasonFilterSet",
]


class ReservationDenyReasonFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationDenyReason
        fields = [
            "reason",
        ]
        order_by = [
            "rank",
        ]

    @staticmethod
    def order_by_rank(qs: models.QuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by(models.OrderBy(models.F("rank"), descending=desc, nulls_last=True))
