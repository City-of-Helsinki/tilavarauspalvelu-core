from django.db import models
from lookup_property import L
from undine import Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import SuitableTimeRange, User

__all__ = [
    "SuitableTimeRangeFilterSet",
]


class SuitableTimeRangeFilterSet(FilterSet[SuitableTimeRange]):
    pk = Filter(lookup="in")
    priority = Filter(lookup="in")

    @Filter
    def fulfilled(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        return models.Q(L(fulfilled=value))
