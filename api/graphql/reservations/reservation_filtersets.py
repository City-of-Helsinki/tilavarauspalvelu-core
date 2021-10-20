import django_filters

from reservations.models import Reservation


class ReservationFilterSet(django_filters.FilterSet):
    begin = django_filters.DateTimeFilter(field_name="begin", lookup_expr="gte")
    end = django_filters.DateTimeFilter(field_name="end", lookup_expr="lte")

    class Meta:
        model = Reservation
        fields = ["begin", "end"]
