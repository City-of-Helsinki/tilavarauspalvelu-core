import django_filters
from django.contrib.auth import get_user_model
from django.contrib.postgres.search import SearchVector
from django.db import models

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

    order_by = django_filters.OrderingFilter(fields=["pk", "applicant"])

    class Meta:
        model = Application
        fields = []

    def filter_queryset(self, queryset: ApplicationQuerySet) -> ApplicationQuerySet:
        return super().filter_queryset(queryset.with_applicant_alias())

    @staticmethod
    def filter_by_text_search(qs: ApplicationQuerySet, name: str, value: str) -> models.QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        vector = SearchVector("id", "application_events__id", "application_events__name", "applicant")
        query = raw_prefixed_query(value)
        return qs.annotate(search=vector).filter(search=query)

    @staticmethod
    def filter_by_status(qs: ApplicationQuerySet, name: str, value: list[str]) -> ApplicationQuerySet:
        return qs.has_status_in(value)
