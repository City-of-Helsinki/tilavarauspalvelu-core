import django_filters


class PurposeFilterSet(django_filters.FilterSet):
    order_by = django_filters.OrderingFilter(
        fields=("rank", "name_fi", "name_en", "name_sv"),
    )

    def filter_queryset(self, queryset):
        return super().filter_queryset(queryset.order_by("rank"))
