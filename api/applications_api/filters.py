from django_filters import rest_framework as filters

from applications.models import ApplicationRound


class ApplicationFilter(filters.FilterSet):
    application_round = filters.ModelChoiceFilter(
        field_name="application_round", queryset=ApplicationRound.objects.all()
    )
    status = filters.BaseInFilter(field_name="cached_latest_status")
