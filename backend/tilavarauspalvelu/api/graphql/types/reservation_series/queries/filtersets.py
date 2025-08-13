from django.db import models
from undine import Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import ReservationSeries, User

__all__ = [
    "ReservationSeriesFilterSet",
]


class ReservationSeriesFilterSet(FilterSet[ReservationSeries]):
    pk = Filter(lookup="in")
    ext_uuid = Filter()
    name = Filter()

    begin_date = Filter(lookup="gte")
    end_date = Filter(lookup="lte")
    begin_time = Filter(lookup="gte")
    end_time = Filter(lookup="lte")

    user = Filter()
    reservation_unit = Filter(lookup="in")
    unit = Filter("reservation_unit__unit", lookup="in")

    reservation_unit_type = Filter("reservation_unit__reservation_unit_type", lookup="in")

    @Filter
    def reservation_unit_name_fi(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_fi__istartswith=word)
        return q

    @Filter
    def reservation_unit_name_en(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_en__istartswith=word)
        return q

    @Filter
    def reservation_unit_name_sv(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_sv__istartswith=word)
        return q
