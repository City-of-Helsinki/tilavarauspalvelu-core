from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from lookup_property import L
from undine import Filter, FilterSet

from tilavarauspalvelu.enums import AccessCodeState, AccessType
from tilavarauspalvelu.models import AllocatedTimeSlot
from utils.db import build_search

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "AllocatedTimeSlotFilterSet",
]


class AllocatedTimeSlotFilterSet(FilterSet[AllocatedTimeSlot], auto=False):
    pk = Filter(lookup="in")
    day_of_the_week = Filter(lookup="in")
    application_round = Filter("reservation_unit_option__application_section__application__application_round")
    application_section_status = Filter(L("reservation_unit_option__application_section__status"), lookup="in")
    applicant_type = Filter("reservation_unit_option__application_section__application__applicant_type", lookup="in")
    allocated_unit = Filter("reservation_unit_option__reservation_unit__unit", lookup="in")
    unit_group = Filter("reservation_unit_option__reservation_unit__unit__unit_groups", lookup="in")
    allocated_reservation_unit = Filter("reservation_unit_option__reservation_unit", lookup="in")

    access_code_state = Filter(
        models.Case(
            models.When(
                ~L(reservation_series__used_access_types__contains=[AccessType.ACCESS_CODE]),
                then=models.Value(AccessCodeState.ACCESS_CODE_NOT_REQUIRED.value),
            ),
            models.When(
                L(reservation_series__is_access_code_is_active_correct=True),
                then=models.Value(AccessCodeState.ACCESS_CODE_CREATED.value),
            ),
            default=models.Value(AccessCodeState.ACCESS_CODE_PENDING.value),
            output_field=models.CharField(),
        ),
        lookup="in",
    )

    @Filter(
        required_aliases={
            "applicant": L("reservation_unit_option__application_section__application__applicant"),
            "ts_vector": SearchVector(
                "reservation_unit_option__application_section__id",
                "reservation_unit_option__application_section__name",
                "reservation_unit_option__application_section__application__id",
                "applicant",
                config="finnish",
            ),
        }
    )
    def text_search(self, info: GQLInfo, value: str) -> models.Q:
        search = build_search(value)
        return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))
