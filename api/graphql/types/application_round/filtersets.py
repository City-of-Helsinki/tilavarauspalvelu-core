import django_filters

from applications.models import ApplicationRound
from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter


class ApplicationRoundFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()
    order_by = django_filters.OrderingFilter(fields=["pk"])

    class Meta:
        model = ApplicationRound
        fields = {
            "name": ["istartswith"],
        }
