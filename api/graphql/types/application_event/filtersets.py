from typing import TypedDict

import django_filters
from django.contrib.postgres.search import SearchVector
from django.db import models
from django.db.models import QuerySet

from applications.choices import ApplicantTypeChoice, ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent
from applications.querysets.application_event import ApplicationEventQuerySet
from common.filtersets import (
    BaseModelFilterSet,
    EnumChoiceFilter,
    EnumMultipleChoiceFilter,
    IntChoiceFilter,
    IntMultipleChoiceFilter,
)


class CombinedPreferredOrderFilterValues(TypedDict):
    preferred_order: list[int]
    include_preferred_order_10_or_higher: bool


class ApplicationEventFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()
    user = IntChoiceFilter(field_name="application__user")
    application_round = IntChoiceFilter(field_name="application__application_round")
    reservation_unit = IntMultipleChoiceFilter(field_name="event_reservation_units__reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="event_reservation_units__reservation_unit__unit")

    applicant_type = EnumMultipleChoiceFilter(field_name="application__applicant_type", enum=ApplicantTypeChoice)
    status = EnumChoiceFilter(method="filter_by_status", enum=ApplicationEventStatusChoice)
    application_status = EnumChoiceFilter(method="filter_by_application_status", enum=ApplicationStatusChoice)
    priority = IntMultipleChoiceFilter(field_name="application_event_schedules__priority")

    preferred_order = IntMultipleChoiceFilter(method="filter_include_preferred_order")
    include_preferred_order_10_or_higher = django_filters.BooleanFilter(method="filter_include_preferred_order")

    home_city = IntMultipleChoiceFilter(field_name="application__home_city")
    age_group = IntMultipleChoiceFilter()
    purpose = IntMultipleChoiceFilter()

    text_search = django_filters.CharFilter(method="filter_text_search")

    order_by = django_filters.OrderingFilter(fields=["pk", "applicant", "name_fi", "name_en", "name_sv"])

    class Meta:
        model = ApplicationEvent
        fields = {
            "name": ["istartswith"],
            "application": ["exact"],
        }
        combination_methods = [
            "filter_include_preferred_order",
        ]

    def filter_queryset(self, queryset: ApplicationEventQuerySet) -> QuerySet:
        return super().filter_queryset(queryset.with_applicant_alias())

    @staticmethod
    def filter_by_status(qs: ApplicationEventQuerySet, name: str, value: str) -> QuerySet:
        return qs.has_status(ApplicationEventStatusChoice(value))

    @staticmethod
    def filter_by_application_status(qs: ApplicationEventQuerySet, name: str, value: str) -> QuerySet:
        return qs.has_application_status(ApplicationStatusChoice(value))

    @staticmethod
    def filter_include_preferred_order(
        qs: ApplicationEventQuerySet,
        name: str,
        value: CombinedPreferredOrderFilterValues,
    ) -> QuerySet:
        q = models.Q()
        if value["preferred_order"]:
            q |= models.Q(event_reservation_units__priority__in=value["preferred_order"])
        if value["include_preferred_order_10_or_higher"]:
            q |= models.Q(event_reservation_units__priority__gte=10)

        return qs.filter(q) if q != models.Q() else qs

    @staticmethod
    def filter_text_search(qs: ApplicationEventQuerySet, name: str, value: str) -> QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        return qs.annotate(search=SearchVector("application__id", "id", "name", "applicant")).filter(search=value)
