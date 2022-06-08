from django.db.models import Case, CharField, F
from django.db.models import Value as V
from django.db.models import When
from django.db.models.functions import Concat
from django_filters import rest_framework as filters

from applications.models import Application, ApplicationEvent, ApplicationRound, User
from reservation_units.models import ReservationUnit
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

    order_by = filters.OrderingFilter(fields=("pk", "applicant"))

    class Meta:
        model = Application
        fields = ("application_round", "status", "unit", "user")

    def filter_queryset(self, queryset):
        queryset = queryset.alias(
            applicant=Case(
                When(organisation__isnull=False, then=F("organisation__name")),
                When(
                    contact_person__isnull=False,
                    then=Concat(
                        "contact_person__first_name",
                        V(" "),
                        "contact_person__last_name",
                    ),
                ),
                When(
                    user__isnull=False,
                    then=Concat(
                        "user__first_name",
                        V(" "),
                        "user__last_name",
                    ),
                ),
                default=V(""),
                output_field=CharField(),
            )
        )

        return super().filter_queryset(queryset)

    def filter_by_possible_units(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(
            application_events__event_reservation_units__reservation_unit__unit__in=value
        )


class ApplicationEventFilterSet(filters.FilterSet):
    pk = filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=ApplicationEvent.objects.all()
    )

    application_round = filters.ModelChoiceFilter(
        field_name="application__application_round",
        queryset=ApplicationRound.objects.all(),
    )

    application = filters.ModelChoiceFilter(
        field_name="application", queryset=Application.objects.all()
    )

    unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_possible_units", queryset=Unit.objects.all()
    )

    status = filters.CharFilter(field_name="latest_status", lookup_expr="iexact")

    reservation_unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_reservation_units", queryset=ReservationUnit.objects.all()
    )

    user = filters.ModelChoiceFilter(
        field_name="application__user", queryset=User.objects.all()
    )

    order_by = filters.OrderingFilter(
        fields=("pk", "applicant", "name_fi", "name_en", "name_sv")
    )

    class Meta:
        model = Application
        fields = ("application_round", "status", "unit", "user")

    def filter_queryset(self, queryset):
        queryset = queryset.alias(
            applicant=Case(
                When(
                    application__organisation__isnull=False,
                    then=F("application__organisation__name"),
                ),
                When(
                    application__contact_person__isnull=False,
                    then=Concat(
                        "application__contact_person__first_name",
                        V(" "),
                        "application__contact_person__last_name",
                    ),
                ),
                When(
                    application__user__isnull=False,
                    then=Concat(
                        "application__user__first_name",
                        V(" "),
                        "application__user__last_name",
                    ),
                ),
                default=V(""),
                output_field=CharField(),
            )
        )

        return super().filter_queryset(queryset)

    def filter_by_possible_units(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(event_reservation_units__reservation_unit__unit__in=value)

    def filter_by_reservation_units(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(event_reservation_units__reservation_unit__in=value)

    def filter_by_pk(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(id__in=[event.id for event in value])
