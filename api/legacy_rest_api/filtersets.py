from django_filters import rest_framework as filters

from api.legacy_rest_api.filters import ModelInFilter, NumberInFilter
from applications.models import ApplicationEvent, ApplicationRound
from reservation_units.models import Purpose, ReservationUnit, ReservationUnitType
from reservations.choices import ReservationStateChoice
from reservations.models import RecurringReservation, Reservation
from spaces.models import Unit


class ReservationFilter(filters.FilterSet):
    state = filters.MultipleChoiceFilter(
        field_name="state",
        choices=ReservationStateChoice.choices,
    )

    # Effectively active or inactive only reservations
    active = filters.BooleanFilter(method="is_active", help_text="Show only confirmed and active reservations.")

    reservation_unit = filters.ModelMultipleChoiceFilter(
        field_name="reservation_unit",
        queryset=ReservationUnit.objects.all(),
        help_text="Show only reservations to certain reservation units.",
    )

    def is_active(self, queryset, value, *args, **kwargs):
        active_only = bool(args[0])
        if active_only:
            return queryset.filter(state="confirmed")
        return queryset.exclude(state="confirmed")

    class Meta:
        model = Reservation
        fields = ["state"]


class RecurringReservationFilter(filters.FilterSet):
    application_event_schedule = filters.ModelMultipleChoiceFilter(
        field_name="application_event_schedule",
        queryset=ApplicationEvent.objects.all(),
        help_text="Show only recurring reservations for specified application_event_schedule.",
    )
    reservation_unit = ModelInFilter(
        field_name="reservations__reservation_unit",
        queryset=ReservationUnit.objects.all(),
    )

    class Meta:
        model = RecurringReservation
        fields = []


class ReservationUnitFilter(filters.FilterSet):
    purpose = filters.ModelMultipleChoiceFilter(field_name="purposes", queryset=Purpose.objects.all())
    application_round = filters.ModelMultipleChoiceFilter(
        field_name="application_rounds",
        queryset=ApplicationRound.objects.all(),
    )
    max_persons = filters.NumberFilter(
        field_name="spaces__max_persons",
        lookup_expr="gte",
    )
    reservation_unit_type = filters.ModelChoiceFilter(
        field_name="reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )
    unit = filters.ModelChoiceFilter(field_name="unit", queryset=Unit.objects.all())

    ids = NumberInFilter(field_name="id", lookup_expr="in")

    is_draft = filters.BooleanFilter(field_name="is_draft")
