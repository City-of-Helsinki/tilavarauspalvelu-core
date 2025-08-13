from typing import TypedDict

from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import DjangoExpression, Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import ApplicationSection, User
from utils.db import build_search

__all__ = [
    "ApplicationSectionFilterSet",
]


class PreferredOrderFilter(TypedDict):
    values: list[int]
    all_higher_than_10: bool


class ApplicationSectionFilterSet(FilterSet[ApplicationSection]):
    pk = Filter(lookup="in")
    ext_uuid = Filter()
    name = Filter(lookup="istartswith")

    application = Filter()
    age_group = Filter(lookup="in")
    purpose = Filter(lookup="in")
    user = Filter("application__user")
    application_round = Filter("application__application_round")
    reservation_unit = Filter("reservation_unit_options__reservation_unit", lookup="in", distinct=True)
    unit = Filter("reservation_unit_options__reservation_unit__unit", lookup="in", distinct=True)
    unit_group = Filter("reservation_unit_options__reservation_unit__unit__unit_groups", lookup="in", distinct=True)

    applicant_type = Filter("application__applicant_type", lookup="in")
    priority = Filter("suitable_time_ranges__priority", lookup="in")
    municipality = Filter("application__municipality", lookup="in")

    status = Filter(L("status"), lookup="in")
    application_status = Filter(L("application__status"), lookup="in")

    @Filter
    def preferred_order(self, info: GQLInfo[User], *, value: PreferredOrderFilter) -> models.Q:
        q = models.Q()
        if value["values"]:
            q |= models.Q(reservation_unit_options__preferred_order__in=value["values"])
        if value["all_higher_than_10"]:
            q |= models.Q(reservation_unit_options__preferred_order__gte=10)
        return q

    @Filter
    def text_search(self, info: GQLInfo[User], *, value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))

    @text_search.aliases
    def text_search_aliases(self, info: GQLInfo[User], *, value: str) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "applicant": L("application__applicant"),
            "ts_vector": SearchVector(
                "id",
                "application__id",
                "name",
                "applicant",
                config="finnish",
            ),
        }

    @Filter
    def has_allocations(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        if value:
            return models.Q(L(allocations__gt=0))
        return models.Q(L(allocations=0))
