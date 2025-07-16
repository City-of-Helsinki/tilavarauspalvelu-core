from __future__ import annotations

from lookup_property import L

from tilavarauspalvelu.models import SuitableTimeRange

from .filtersets import SuitableTimeRangeFilterSet


class SuitableTimeRangeNode(DjangoNode):
    fulfilled = AnnotatedField(graphene.Boolean, expression=L("fulfilled"), required=True)

    class Meta:
        model = SuitableTimeRange
        fields = [
            "pk",
            "priority",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "application_section",
            "fulfilled",
        ]
        filterset_class = SuitableTimeRangeFilterSet
        permission_classes = [AllowAuthenticated]
