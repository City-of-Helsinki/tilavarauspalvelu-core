import django_filters

from reservations.models import Reservation


class ReservationFilterSet(django_filters.FilterSet):
    begin = django_filters.DateTimeFilter(field_name="begin", lookup_expr="gte")
    end = django_filters.DateTimeFilter(field_name="end", lookup_expr="lte")
    handling_required = django_filters.BooleanFilter(method="get_handling_required")
    state = django_filters.CharFilter(field_name="state", lookup_expr="iexact")

    class Meta:
        model = Reservation
        fields = ["begin", "end"]

    def get_handling_required(self, qs, property, value: str):
        if value:
            return qs.handling_required()

        return qs.exclude(id__in=qs.handling_required().values_list("id", flat=True))
