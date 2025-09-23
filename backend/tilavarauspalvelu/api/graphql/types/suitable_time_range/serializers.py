from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import SuitableTimeRange

__all__ = [
    "SuitableTimeRangeSerializer",
]


class SuitableTimeRangeSerializer(NestingModelSerializer):
    class Meta:
        model = SuitableTimeRange
        fields = [
            "pk",
            "priority",
            "day_of_the_week",
            "begin_time",
            "end_time",
        ]
