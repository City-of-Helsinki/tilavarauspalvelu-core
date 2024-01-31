import django_filters

from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter
from reservations.models import AgeGroup


class AgeGroupFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()

    order_by = django_filters.OrderingFilter(fields=["pk"])

    class Meta:
        model = AgeGroup
        fields = [
            "pk",
        ]
