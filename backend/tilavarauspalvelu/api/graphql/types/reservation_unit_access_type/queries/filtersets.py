from django.db import models
from lookup_property import L
from undine import Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import ReservationUnitAccessType, User
from utils.date_utils import local_date

__all__ = [
    "ReservationUnitAccessTypeFilterSet",
]


class ReservationUnitAccessTypeFilterSet(FilterSet[ReservationUnitAccessType]):
    pk = Filter(lookup="in")

    @Filter
    def is_active_or_future(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        ftr = L(end_date__gt=local_date())
        return ftr if value else ~ftr
