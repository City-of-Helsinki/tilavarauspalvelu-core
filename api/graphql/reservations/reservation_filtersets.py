import django_filters
from django.db.models import Q

from reservations.models import STATE_CHOICES, Reservation


class ReservationFilterSet(django_filters.FilterSet):
    begin = django_filters.DateTimeFilter(field_name="begin", lookup_expr="gte")
    end = django_filters.DateTimeFilter(field_name="end", lookup_expr="lte")
    state = django_filters.CharFilter(field_name="state", lookup_expr="iexact")

    # Filter for displaying reservations which requires or had required handling.
    requested = django_filters.BooleanFilter(method="get_requested")

    order_by = django_filters.OrderingFilter(
        fields=(
            "state",
            "begin",
            "end",
            "name",
            "price",
            "pk",
        )
    )

    class Meta:
        model = Reservation
        fields = ["begin", "end"]

    def get_requested(self, qs, property, value: str):
        query = Q(state=STATE_CHOICES.REQUIRES_HANDLING) | Q(handled_at__isnull=False)
        if value:
            return qs.filter(query)
        return qs.exclude(query)
