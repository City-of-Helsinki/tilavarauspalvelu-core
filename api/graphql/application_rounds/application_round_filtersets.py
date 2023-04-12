from django_filters import rest_framework as filters

from applications.models import ApplicationRound


class ApplicationRoundFilterSet(filters.FilterSet):
    pk = filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=ApplicationRound.objects.all()
    )

    def filter_by_pk(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(id__in=[event.id for event in value])
