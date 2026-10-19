from __future__ import annotations

import graphene
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated
from lookup_property import L
from query_optimizer import AnnotatedField

from tilavarauspalvelu.models import SuitableTimeRange
from tilavarauspalvelu.typing import AnyUser

from .filtersets import SuitableTimeRangeFilterSet


class SuitableTimeRangeNode(DjangoNode[SuitableTimeRange, AnyUser]):
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
