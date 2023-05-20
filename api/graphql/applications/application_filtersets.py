from django.db.models import Case, CharField, F
from django.db.models import Value as V
from django.db.models import When
from django.db.models.functions import Concat
from django_filters import rest_framework as filters

from applications.models import (
    APPLICANT_TYPE_CONST,
    Application,
    ApplicationEvent,
    ApplicationRound,
    ApplicationStatus,
    User,
)
from reservation_units.models import ReservationUnit
from spaces.models import Unit


class ApplicationFilterSet(filters.FilterSet):
    pk = filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=Application.objects.all()
    )

    applied_count_gte = filters.NumberFilter(method="filter_by_applied_count_gte")

    applied_count_lte = filters.NumberFilter(method="filter_by_applied_count_lte")

    application_round = filters.ModelChoiceFilter(
        field_name="application_round", queryset=ApplicationRound.objects.all()
    )
    status = filters.MultipleChoiceFilter(
        field_name="latest_status",
        lookup_expr="iexact",
        choices=[(c[0], c[1]) for c in ApplicationStatus.STATUS_CHOICES],
    )
    unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_possible_units", queryset=Unit.objects.all()
    )
    user = filters.ModelChoiceFilter(field_name="user", queryset=User.objects.all())

    applicant_type = filters.MultipleChoiceFilter(
        field_name="applicant_type",
        method="filter_by_applicant_type",
        choices=[(c[0], c[1]) for c in APPLICANT_TYPE_CONST.APPLICANT_TYPE_CHOICES],
    )

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

    def filter_by_applied_count_gte(self, qs, property, value):
        return qs.filter(
            aggregated_data__name="applied_min_duration_total",
            aggregated_data__value__gte=value,
        )

    def filter_by_applied_count_lte(self, qs, property, value):
        return qs.filter(
            aggregated_data__name="applied_min_duration_total",
            aggregated_data__value__lte=value,
        )

    def filter_by_possible_units(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(
            application_events__event_reservation_units__reservation_unit__unit__in=value
        )

    def filter_by_applicant_type(self, qs, property, value):
        if not value:
            return qs

        values = [v.lower() for v in value]
        return qs.filter(applicant_type__in=values)

    def filter_by_pk(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(id__in=[event.id for event in value])


class ApplicationEventFilterSet(filters.FilterSet):
    pk = filters.ModelMultipleChoiceFilter(
        field_name="pk", method="filter_by_pk", queryset=ApplicationEvent.objects.all()
    )

    application = filters.ModelChoiceFilter(
        field_name="application", queryset=Application.objects.all()
    )

    applied_count_gte = filters.NumberFilter(method="filter_by_applied_count_gte")

    applied_count_lte = filters.NumberFilter(method="filter_by_applied_count_lte")

    application_round = filters.ModelChoiceFilter(
        field_name="application__application_round",
        queryset=ApplicationRound.objects.all(),
    )

    application_status = filters.CharFilter(
        field_name="application__latest_status", method="filter_by_application_status"
    )

    applicant_type = filters.MultipleChoiceFilter(
        field_name="application__applicant_type",
        method="filter_by_applicant_type",
        choices=[(c[0], c[1]) for c in APPLICANT_TYPE_CONST.APPLICANT_TYPE_CHOICES],
    )

    name = filters.CharFilter(field_name="name", lookup_expr="istartswith")

    reservation_unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_reservation_units", queryset=ReservationUnit.objects.all()
    )

    status = filters.CharFilter(field_name="latest_status", lookup_expr="iexact")

    unit = filters.ModelMultipleChoiceFilter(
        method="filter_by_possible_units", queryset=Unit.objects.all()
    )

    user = filters.ModelChoiceFilter(
        field_name="application__user", queryset=User.objects.all()
    )

    order_by = filters.OrderingFilter(
        fields=("pk", "applicant", "name_fi", "name_en", "name_sv")
    )

    class Meta:
        model = ApplicationEvent
        fields = (
            "pk",
            "status",
        )

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

    def filter_by_applied_count_gte(self, qs, property, value):
        return qs.filter(
            aggregated_data__name="duration_total", aggregated_data__value__gte=value
        )

    def filter_by_applied_count_lte(self, qs, property, value):
        return qs.filter(
            aggregated_data__name="duration_total", aggregated_data__value__lte=value
        )

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

    def filter_by_applicant_type(self, qs, property, value):
        if not value:
            return qs

        values = [v.lower() for v in value]
        return qs.filter(application__applicant_type__in=values)

    def filter_by_application_status(self, qs, property, value):
        apps = Application.objects.filter(latest_status=value).values_list("id")
        return qs.filter(application_id__in=apps)
