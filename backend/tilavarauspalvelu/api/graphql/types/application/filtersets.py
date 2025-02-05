from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntChoiceFilter, IntMultipleChoiceFilter
from lookup_property import L

from tilavarauspalvelu.enums import ApplicantTypeChoice, ApplicationStatusChoice
from tilavarauspalvelu.models import Application
from utils.db import text_search
from utils.utils import log_text_search

if TYPE_CHECKING:
    from django.db import models
    from django.db.models import QuerySet

    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet

__all__ = [
    "ApplicationFilterSet",
]


class ApplicationFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    application_round = IntChoiceFilter()
    user = IntChoiceFilter()
    applicant_type = EnumMultipleChoiceFilter(enum=ApplicantTypeChoice)
    status = EnumMultipleChoiceFilter(method="filter_by_status", enum=ApplicationStatusChoice)
    unit = IntMultipleChoiceFilter(field_name="application_sections__reservation_unit_options__reservation_unit__unit")
    text_search = django_filters.CharFilter(method="filter_by_text_search")

    class Meta:
        model = Application
        order_by = [
            "pk",
            "applicant",
            "applicant_type",
            "preferred_unit_name_fi",
            "preferred_unit_name_en",
            "preferred_unit_name_sv",
            "status",
            "sent_date",
        ]

    @staticmethod
    def filter_by_text_search(qs: ApplicationQuerySet, name: str, value: str) -> models.QuerySet:
        fields = ("id", "application_sections__id", "application_sections__name", "applicant")
        qs = qs.alias(applicant=L("applicant"))
        log_text_search(where="applications", text=value)
        return text_search(qs=qs, fields=fields, text=value)

    @staticmethod
    def filter_by_status(qs: ApplicationQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_status_in(value)

    @staticmethod
    def order_by_applicant(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_applicant(desc=desc)

    @staticmethod
    def order_by_applicant_type(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_applicant_type(desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_fi(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="fi", desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_en(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="en", desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_sv(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="sv", desc=desc)

    @staticmethod
    def order_by_status(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_status(desc=desc)
