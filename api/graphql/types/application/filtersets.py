import django_filters
from django.contrib.postgres.search import SearchVector
from django.db import models
from django.db.models import QuerySet
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntChoiceFilter, IntMultipleChoiceFilter
from lookup_property import L

from applications.enums import ApplicantTypeChoice, ApplicationStatusChoice
from applications.models import Application
from applications.querysets.application import ApplicationQuerySet
from common.db import raw_prefixed_query

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
        ]

    @staticmethod
    def filter_by_text_search(qs: ApplicationQuerySet, name: str, value: str) -> models.QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        vector = SearchVector("id", "application_sections__id", "application_sections__name", "applicant")
        query = raw_prefixed_query(value)
        return qs.alias(applicant=L("applicant")).annotate(search=vector).filter(search=query)

    @staticmethod
    def filter_by_status(qs: ApplicationQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_status_in(value)

    @staticmethod
    def order_by_applicant(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_applicant(desc)

    @staticmethod
    def order_by_applicant_type(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_applicant_type(desc)

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
