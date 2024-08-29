from typing import Any

import django_filters
from django.db import models
from django.db.models import QuerySet
from django.db.models.functions import Lower
from graphene_django_extensions.filters import (
    EnumMultipleChoiceFilter,
    IntChoiceFilter,
    IntMultipleChoiceFilter,
    ModelFilterSet,
)
from lookup_property import L

from applications.enums import ApplicantTypeChoice, ApplicationSectionStatusChoice, ApplicationStatusChoice, Priority
from applications.models import ApplicationSection
from applications.querysets.application_section import ApplicationSectionQuerySet
from common.db import text_search

__all__ = [
    "ApplicationSectionFilterSet",
]


class ApplicationSectionFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name = django_filters.CharFilter(lookup_expr="istartswith")
    user = IntChoiceFilter(field_name="application__user")
    application = IntChoiceFilter(field_name="application__pk")
    application_round = IntChoiceFilter(field_name="application__application_round")
    reservation_unit = IntMultipleChoiceFilter(field_name="reservation_unit_options__reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="reservation_unit_options__reservation_unit__unit")

    applicant_type = EnumMultipleChoiceFilter(field_name="application__applicant_type", enum=ApplicantTypeChoice)
    status = EnumMultipleChoiceFilter(method="filter_by_status", enum=ApplicationSectionStatusChoice)
    application_status = EnumMultipleChoiceFilter(method="filter_by_application_status", enum=ApplicationStatusChoice)
    priority = EnumMultipleChoiceFilter(field_name="suitable_time_ranges__priority", enum=Priority)

    preferred_order = IntMultipleChoiceFilter(method="filter_include_preferred_order")
    include_preferred_order_10_or_higher = django_filters.BooleanFilter(method="filter_include_preferred_order")

    home_city = IntMultipleChoiceFilter(field_name="application__home_city")
    age_group = IntMultipleChoiceFilter()
    purpose = IntMultipleChoiceFilter()

    text_search = django_filters.CharFilter(method="filter_text_search")

    has_allocations = django_filters.BooleanFilter(method="filter_has_allocations")

    class Meta:
        model = ApplicationSection
        combination_methods = [
            "filter_include_preferred_order",
        ]
        order_by = [
            "pk",
            ("application__pk", "application_pk"),
            "applicant",
            "name",
            "status",
            "application_status",
            "preferred_unit_name_fi",
            "preferred_unit_name_en",
            "preferred_unit_name_sv",
            "has_allocations",
            "allocations",
        ]

    @staticmethod
    def filter_by_status(qs: ApplicationSectionQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_status_in(value)

    @staticmethod
    def filter_by_application_status(qs: ApplicationSectionQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_application_status_in(value)

    @staticmethod
    def filter_include_preferred_order(qs: ApplicationSectionQuerySet, name: str, value: dict[str, Any]) -> QuerySet:
        q = models.Q()
        if value["preferred_order"]:
            q |= models.Q(reservation_unit_options__preferred_order__in=value["preferred_order"])
        if value["include_preferred_order_10_or_higher"]:
            q |= models.Q(reservation_unit_options__preferred_order__gte=10)

        return qs.filter(q) if q != models.Q() else qs

    @staticmethod
    def filter_text_search(qs: ApplicationSectionQuerySet, name: str, value: str) -> QuerySet:
        fields = ("application__id", "id", "name", "applicant")
        qs = qs.alias(applicant=L("application__applicant"))
        return text_search(qs=qs, fields=fields, text=value)

    def filter_has_allocations(self, queryset: ApplicationSectionQuerySet, name: str, value: bool) -> QuerySet:
        if value:
            return queryset.filter(L(allocations__gt=0))
        return queryset.filter(L(allocations=0))

    @staticmethod
    def order_by_name(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.alias(name_lower=Lower("name")).order_by(models.OrderBy(models.F("name_lower"), descending=desc))

    @staticmethod
    def order_by_status(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_status(desc=desc)

    @staticmethod
    def order_by_application_status(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_application_status(desc=desc)

    @staticmethod
    def order_by_applicant(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_applicant(desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_fi(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="fi", desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_en(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="en", desc=desc)

    @staticmethod
    def order_by_preferred_unit_name_sv(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_preferred_unit_name(lang="sv", desc=desc)

    @staticmethod
    def order_by_has_allocations(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by(models.OrderBy(L(allocations__gt=0), descending=desc))

    @staticmethod
    def order_by_allocations(qs: ApplicationSectionQuerySet, desc: bool) -> QuerySet:
        return qs.order_by(models.OrderBy(L("allocations"), descending=desc))
