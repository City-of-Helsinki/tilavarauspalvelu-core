from django_filters import rest_framework as filters

from applications.models import ApplicationEvent, ApplicationRound
from spaces.models import Unit


class ApplicationFilter(filters.FilterSet):
    application_round = filters.ModelChoiceFilter(
        field_name="application_round", queryset=ApplicationRound.objects.all()
    )
    status = filters.BaseInFilter(field_name="cached_latest_status")
    unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_possible_units", queryset=Unit.objects.all()
    )

    def filter_by_possible_units(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(
            application_events__event_reservation_units__reservation_unit__unit__in=value
        )


class ApplicationEventWeeklyAmountReductionFilter(filters.FilterSet):
    application_event_id = filters.ModelChoiceFilter(
        field_name="application_event", queryset=ApplicationEvent.objects.all()
    )
