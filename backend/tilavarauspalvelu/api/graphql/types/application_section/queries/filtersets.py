from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import Filter, FilterSet

from tilavarauspalvelu.models import ApplicationSection
from utils.db import build_search

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ApplicationSectionFilterSet",
]


class PreferredOrderFilter(TypedDict):
    values: list[int]
    all_higher_than_10: bool


class ApplicationSectionFilterSet(FilterSet[ApplicationSection], auto=False):
    pk = Filter(lookup="in")
    ext_uuid = Filter()
    name = Filter(lookup="istartswith")

    application = Filter()
    age_group = Filter(lookup="in")
    purpose = Filter(lookup="in")
    user = Filter("application__user")
    application_round = Filter("application__application_round")
    reservation_unit = Filter("reservation_unit_options__reservation_unit", lookup="in")
    unit = Filter("reservation_unit_options__reservation_unit__unit", lookup="in")

    unit_group = Filter("reservation_unit_options__reservation_unit__unit__unit_groups", lookup="in")

    applicant_type = Filter("application__applicant_type", lookup="in")
    priority = Filter("suitable_time_ranges__priority", lookup="in")
    municipality = Filter("application__municipality", lookup="in")

    status = Filter(L("status"), lookup="in")
    application_status = Filter(L("application__status"), lookup="in")

    @Filter
    def preferred_order(self, info: GQLInfo, *, value: PreferredOrderFilter) -> models.Q:
        q = models.Q()
        if value["values"]:
            q |= models.Q(reservation_unit_options__preferred_order__in=value["values"])
        if value["all_higher_than_10"]:
            q |= models.Q(reservation_unit_options__preferred_order__gte=10)
        return q

    @Filter(
        required_aliases={
            "applicant": L("application__applicant"),
            "ts_vector": SearchVector(
                "id",
                "application__id",
                "name",
                "applicant",
                config="finnish",
            ),
        }
    )
    def text_search(self, info: GQLInfo, *, value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))

    @Filter
    def has_allocations(self, info: GQLInfo, *, value: bool) -> models.Q:
        if value:
            return models.Q(L(allocations__gt=0))
        return models.Q(L(allocations=0))
