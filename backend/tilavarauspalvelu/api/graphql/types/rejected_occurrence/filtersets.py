from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntChoiceFilter, IntMultipleChoiceFilter
from lookup_property import L

from tilavarauspalvelu.models import RejectedOccurrence
from utils.db import text_search
from utils.utils import log_text_search

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.rejected_occurrence.queryset import RejectedOccurrenceQuerySet

__all__ = [
    "RejectedOccurrenceFilterSet",
]


class RejectedOccurrenceFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    reservation_series = IntChoiceFilter()
    application_round = IntChoiceFilter(
        field_name=(
            "reservation_series"
            "__allocated_time_slot"
            "__reservation_unit_option"
            "__application_section"
            "__application"
            "__application_round"
        )
    )
    reservation_unit = IntMultipleChoiceFilter(field_name="reservation_series__reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="reservation_series__reservation_unit__unit")
    text_search = django_filters.CharFilter(method="filter_text_search")

    class Meta:
        model = RejectedOccurrence
        order_by = [
            "pk",
            "begin_datetime",
            "end_datetime",
            "rejection_reason",
            (
                (
                    "reservation_series"
                    "__allocated_time_slot"
                    "__reservation_unit_option"
                    "__application_section"
                    "__application"
                    "__pk"
                ),
                "application_pk",
            ),
            (
                (
                    "reservation_series"  #
                    "__allocated_time_slot"
                    "__reservation_unit_option"
                    "__application_section"
                    "__pk"
                ),
                "application_section_pk",
            ),
            (
                (
                    "reservation_series"  #
                    "__allocated_time_slot"
                    "__reservation_unit_option"
                    "__application_section"
                    "__name"
                ),
                "application_section_name",
            ),
            "applicant",
            ("reservation_series__reservation_unit__pk", "reservation_unit_pk"),
            ("reservation_series__reservation_unit__name", "reservation_unit_name"),
            ("reservation_series__reservation_unit__unit__pk", "unit_pk"),
            ("reservation_series__reservation_unit__unit__name", "unit_name"),
        ]

    @staticmethod
    def filter_text_search(qs: RejectedOccurrenceQuerySet, name: str, value: str) -> models.QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        fields = (
            "reservation_series__allocated_time_slot__reservation_unit_option__application_section__id",
            "reservation_series__allocated_time_slot__reservation_unit_option__application_section__name",
            "reservation_series__allocated_time_slot__reservation_unit_option__application_section__application__id",
            "applicant",
        )
        applicant_ref = (
            "reservation_series"
            "__allocated_time_slot"
            "__reservation_unit_option"
            "__application_section"
            "__application"
            "__applicant"
        )
        qs = qs.alias(applicant=L(applicant_ref))
        log_text_search(where="rejected_occurrences", text=value)
        return text_search(qs=qs, fields=fields, text=value)

    @staticmethod
    def order_by_applicant(qs: RejectedOccurrenceQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_applicant(desc=desc)

    def order_by_rejection_reason(self, qs: RejectedOccurrenceQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_rejection_reason(desc=desc)
