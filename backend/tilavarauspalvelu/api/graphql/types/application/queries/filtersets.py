from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import Application, User
from utils.db import build_search

__all__ = [
    "ApplicationFilterSet",
]


UNIT_LOOKUP = "application_sections__reservation_unit_options__reservation_unit__unit"


class ApplicationFilterSet(FilterSet[Application]):
    pk = Filter(lookup="in")
    application_round = Filter()
    user = Filter()
    applicant_type = Filter(lookup="in")
    status = Filter(L("status"), lookup="in")

    unit = Filter(UNIT_LOOKUP, lookup="in", distinct=True)
    unit_group = Filter(f"{UNIT_LOOKUP}__unit_groups", lookup="in", distinct=True)

    @Filter
    def text_search(self, info: GQLInfo[User], value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))

    @text_search.aliases
    def text_search_aliases(self, info: GQLInfo[User], *, value: str) -> dict[str, models.Expression]:  # noqa: ARG002
        return {
            "applicant": L("applicant"),
            "application_sections_ids": ArrayAgg("application_sections__id"),
            "application_sections_names": ArrayAgg("application_sections__name"),
            "ts_vector": SearchVector(
                "id",
                "application_sections_ids",
                "application_sections_names",
                "applicant",
                config="finnish",
            ),
        }
