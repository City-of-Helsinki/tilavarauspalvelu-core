import django_filters

from reservation_units.models import Equipment


class EquipmentFilterSet(django_filters.FilterSet):
    rank_gte = django_filters.NumberFilter(field_name="category__rank", lookup_expr="gte")
    rank_lte = django_filters.NumberFilter(field_name="category__rank", lookup_expr="lte")

    order_by = django_filters.OrderingFilter(
        fields=("name", ("category__rank", "category_rank")),
    )

    class Meta:
        model = Equipment
        fields = ["name"]
