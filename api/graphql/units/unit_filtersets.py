import django_filters

from .unit_types import Unit


class UnitsFilterSet(django_filters.FilterSet):
    pk = django_filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=Unit.objects.all()
    )

    order_by = django_filters.OrderingFilter(fields=("name_fi", "name_en", "name_sv"))

    def filter_by_pk(self, qs, property, value):
        if value:
            return qs.filter(id__in=[model.id for model in value])

        return qs
