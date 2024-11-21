import django_filters
from django.db.models import QuerySet
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntMultipleChoiceFilter

from tilavarauspalvelu.enums import Priority
from tilavarauspalvelu.models import SuitableTimeRange
from tilavarauspalvelu.models.suitable_time_range.queryset import SuitableTimeRangeQuerySet


class SuitableTimeRangeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    priority = EnumMultipleChoiceFilter(enum=Priority)
    fulfilled = django_filters.BooleanFilter(method="filter_by_fulfilled")

    class Meta:
        model = SuitableTimeRange

    @staticmethod
    def filter_by_fulfilled(qs: SuitableTimeRangeQuerySet, name: str, value: bool) -> QuerySet:
        return qs.fulfilled(value=value)
