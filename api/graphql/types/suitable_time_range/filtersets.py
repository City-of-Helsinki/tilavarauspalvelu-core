from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntMultipleChoiceFilter

from applications.choices import Priority
from applications.models import SuitableTimeRange


class SuitableTimeRangeFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    priority = EnumMultipleChoiceFilter(enum=Priority)

    class Meta:
        model = SuitableTimeRange
        fields = []
