from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import SuitableTimeRange

if TYPE_CHECKING:
    import datetime

__all__ = [
    "SuitableTimeRangeSerializer",
]


class SuitableTimeRangeSerializer(NestingModelSerializer[SuitableTimeRange]):
    class Meta:
        model = SuitableTimeRange
        fields = [
            "pk",
            "priority",
            "day_of_the_week",
            "begin_time",
            "end_time",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin_time: datetime.time | None = data.get("begin_time")
        end_time: datetime.time | None = data.get("end_time")

        if begin_time is None or end_time is None:
            return data

        SuitableTimeRange.validators.validate_begin_time_before_end_time(begin_time=begin_time, end_time=end_time)

        return data
