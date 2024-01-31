import django_filters

from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter
from reservations.models import ReservationPurpose


class ReservationPurposeFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()

    order_by = django_filters.OrderingFilter(fields=["pk"])

    class Meta:
        model = ReservationPurpose
        fields = [
            "name",
        ]
