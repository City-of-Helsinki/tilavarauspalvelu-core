from django_filters import rest_framework as filters

from applications.models import Application, ApplicationRound, User
from spaces.models import Unit


class ApplicationFilterSet(filters.FilterSet):
    application_round = filters.ModelChoiceFilter(
        field_name="application_round", queryset=ApplicationRound.objects.all()
    )
    status = filters.BaseInFilter(field_name="latest_status")
    unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_possible_units", queryset=Unit.objects.all()
    )
    user = filters.ModelChoiceFilter(field_name="user", queryset=User.objects.all())

    class Meta:
        model = Application
        fields = ("application_round", "status", "unit", "user")

    def filter_by_possible_units(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(
            application_events__event_reservation_units__reservation_unit__unit__in=value
        )
