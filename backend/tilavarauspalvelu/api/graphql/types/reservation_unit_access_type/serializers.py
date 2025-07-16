from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitAccessType

__all__ = [
    "ReservationUnitAccessTypeSerializer",
]


class ReservationUnitAccessTypeSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitAccessType
        fields = [
            "pk",
            "access_type",
            "begin_date",
        ]
