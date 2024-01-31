import django_filters

from common.filtersets import BaseModelFilterSet, IntMultipleChoiceFilter
from reservations.models import ReservationCancelReason


class ReservationDenyReasonFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()

    order_by = django_filters.OrderingFilter(fields=["pk"])

    class Meta:
        model = ReservationCancelReason
        fields = [
            "reason",
        ]
