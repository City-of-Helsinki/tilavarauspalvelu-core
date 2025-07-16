from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import Filter, FilterSet

from tilavarauspalvelu.models import Application
from utils.db import build_search

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ApplicationFilterSet",
]


class ApplicationFilterSet(FilterSet[Application], auto=False):
    pk = Filter(lookup="in")
    application_round = Filter()
    user = Filter()
    applicant_type = Filter(lookup="in")
    status = Filter(L("status"), lookup="in")
    unit = Filter("application_sections__reservation_unit_options__reservation_unit__unit")
    unit_group = Filter("application_sections__reservation_unit_options__reservation_unit__unit__unit_groups")

    @Filter(
        required_aliases={
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
    )
    def text_search(self, info: GQLInfo, value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))
