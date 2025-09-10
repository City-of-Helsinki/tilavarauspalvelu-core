from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import DjangoExpression, Filter, FilterSet, GQLInfo

from tilavarauspalvelu.models import RejectedOccurrence, User
from utils.db import build_search

__all__ = [
    "RejectedOccurrenceFilterSet",
]


SECTION_LOOKUP = "reservation_series__allocated_time_slot__reservation_unit_option__application_section"


class RejectedOccurrenceFilterSet(FilterSet[RejectedOccurrence]):
    pk = Filter(lookup="in")
    reservation_series = Filter()
    application_round = Filter(f"{SECTION_LOOKUP}__application__application_round")
    reservation_unit = Filter("reservation_series__reservation_unit", lookup="in")
    unit = Filter("reservation_series__reservation_unit__unit", lookup="in")
    unit_group = Filter("reservation_series__reservation_unit__unit__unit_groups", lookup="in", distinct=True)

    @Filter
    def text_search(self, info: GQLInfo[User], value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))

    @text_search.aliases
    def text_search_aliases(self, info: GQLInfo[User], *, value: str) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "applicant": L(f"{SECTION_LOOKUP}__application__applicant"),
            "ts_vector": SearchVector(
                f"{SECTION_LOOKUP}__id",
                f"{SECTION_LOOKUP}__name",
                "applicant",
                config="finnish",
            ),
        }
