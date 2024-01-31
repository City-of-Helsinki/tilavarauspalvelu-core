import django_filters

from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter
from reservations.models import AbilityGroup


class AbilityGroupFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()

    order_by = django_filters.OrderingFilter(fields=["pk"])

    class Meta:
        model = AbilityGroup
        fields = [
            "name",
        ]
