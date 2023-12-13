import django_filters
from django.contrib.auth import get_user_model
from django.contrib.postgres.search import SearchVector
from django.db import models
from django.db.models import QuerySet

from api.graphql.extensions.order_filter import CustomOrderingFilter
from applications.choices import ApplicantTypeChoice, ApplicationStatusChoice
from applications.models import Application
from applications.querysets.application import ApplicationQuerySet
from common.db import raw_prefixed_query
from common.filtersets import BaseModelFilterSet, EnumMultipleChoiceFilter, IntChoiceFilter, IntMultipleChoiceFilter

User = get_user_model()


class ApplicationFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()
    application_round = IntChoiceFilter(field_name="application_round")
    applicant_type = EnumMultipleChoiceFilter(enum=ApplicantTypeChoice)
    status = EnumMultipleChoiceFilter(method="filter_by_status", enum=ApplicationStatusChoice)
    unit = IntMultipleChoiceFilter(field_name="application_events__event_reservation_units__reservation_unit__unit")
    applicant = IntChoiceFilter(field_name="user")

    text_search = django_filters.CharFilter(method="filter_by_text_search")

    order_by = CustomOrderingFilter(
        fields=[
            "pk",
            "applicant",
            "applicant_type",
            "preferred_unit_name_fi",
            "preferred_unit_name_en",
            "preferred_unit_name_sv",
            "application_status",
        ]
    )

    class Meta:
        model = Application
        fields = []

    def filter_queryset(self, queryset: ApplicationQuerySet) -> QuerySet:
        return super().filter_queryset(queryset.with_applicant_alias())

    @staticmethod
    def filter_by_text_search(qs: ApplicationQuerySet, name: str, value: str) -> models.QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        vector = SearchVector("id", "application_events__id", "application_events__name", "applicant")
        query = raw_prefixed_query(value)
        return qs.annotate(search=vector).filter(search=query)

    @staticmethod
    def filter_by_status(qs: ApplicationQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_status_in(value)

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
    def order_by_application_status(qs: ApplicationQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_application_status(desc=desc)
