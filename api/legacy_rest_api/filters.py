from django_filters import rest_framework as filters


class NumberInFilter(filters.BaseInFilter, filters.NumberFilter):
    pass


class ModelInFilter(filters.BaseInFilter, filters.ModelChoiceFilter):
    pass
