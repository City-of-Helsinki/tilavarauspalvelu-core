import django_filters

from .unit_types import Unit


class UnitsFilterSet(django_filters.FilterSet):
    pk = django_filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=Unit.objects.all()
    )

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")
    service_sector = django_filters.NumberFilter(field_name="service_sectors__pk")

    order_by = django_filters.OrderingFilter(
        fields=("name_fi", "name_en", "name_sv", "rank")
    )

    def filter_by_pk(self, qs, property, value):
        if value:
            return qs.filter(id__in=[model.id for model in value])

        return qs
