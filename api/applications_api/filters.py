from django_filters import rest_framework as filters

from applications.models import ApplicationEvent, ApplicationRound


class ApplicationFilter(filters.FilterSet):
    application_round = filters.ModelChoiceFilter(
        field_name="application_round", queryset=ApplicationRound.objects.all()
    )
    status = filters.BaseInFilter(field_name="cached_latest_status")


class ApplicationEventWeeklyAmountReductionFilter(filters.FilterSet):
    application_event_id = filters.ModelChoiceFilter(
        field_name="application_event", queryset=ApplicationEvent.objects.all()
    )
