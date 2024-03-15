import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet

from applications.models import ApplicationRound
from common.date_utils import local_datetime
from common.filtersets import IntMultipleChoiceFilter


class ApplicationRoundFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name = django_filters.CharFilter(lookup_expr="istartswith")
    active = django_filters.BooleanFilter(method="filter_by_active")

    class Meta:
        model = ApplicationRound

    def filter_by_active(self, queryset: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        now = local_datetime()
        return queryset.filter(
            models.Q(
                application_period_begin__lte=now,
                application_period_end__gte=now,
                _negated=not value,
            )
        )
