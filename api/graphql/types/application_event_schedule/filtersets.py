import django_filters
from django.contrib.postgres.search import SearchVector
from django.db import models
from django.db.models import QuerySet

from api.graphql.extensions.order_filter import CustomOrderingFilter
from applications.choices import ApplicantTypeChoice, ApplicationEventStatusChoice
from applications.models import ApplicationEventSchedule
from applications.querysets.application_event_schedule import ApplicationEventScheduleQuerySet
from common.db import raw_prefixed_query
from common.filtersets import (
    BaseModelFilterSet,
    EnumMultipleChoiceFilter,
    IntChoiceFilter,
    IntMultipleChoiceFilter,
)


class ApplicationEventScheduleFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()

    application_round = IntChoiceFilter(field_name="application_event__application__application_round")
    application_event_status = EnumMultipleChoiceFilter(
        method="filter_by_event_status",
        enum=ApplicationEventStatusChoice,
    )

    applicant_type = EnumMultipleChoiceFilter(
        field_name="application_event__application__applicant_type",
        enum=ApplicantTypeChoice,
    )
    allocated_unit = IntMultipleChoiceFilter(field_name="allocated_reservation_unit__unit")
    allocated_reservation_unit = IntMultipleChoiceFilter()
    allocated_day = IntMultipleChoiceFilter()
    accepted = django_filters.BooleanFilter(method="filter_accepted")
    declined = django_filters.BooleanFilter()
    unallocated = django_filters.BooleanFilter(method="filter_unallocated")

    text_search = django_filters.CharFilter(method="filter_text_search")

    order_by = CustomOrderingFilter(
        fields=[
            "pk",
            ("application_event__id", "application_event_id"),
            ("application_event__application__id", "application_id"),
            "applicant",
            ("application_event__name_fi", "application_event_name_fi"),
            ("application_event__name_en", "application_event_name_en"),
            ("application_event__name_sv", "application_event_name_sv"),
            ("allocated_reservation_unit__unit__name_fi", "allocated_unit_name_fi"),
            ("allocated_reservation_unit__unit__name_en", "allocated_unit_name_en"),
            ("allocated_reservation_unit__unit__name_sv", "allocated_unit_name_sv"),
            ("allocated_reservation_unit__name_fi", "allocated_reservation_unit_name_fi"),
            ("allocated_reservation_unit__name_en", "allocated_reservation_unit_name_en"),
            ("allocated_reservation_unit__name_sv", "allocated_reservation_unit_name_sv"),
            "allocated_time_of_week",
            "application_status",
            "application_event_status",
        ]
    )

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk"]

    def filter_queryset(self, queryset: ApplicationEventScheduleQuerySet) -> QuerySet:
        return super().filter_queryset(queryset.with_applicant_alias())

    @staticmethod
    def filter_by_event_status(qs: ApplicationEventScheduleQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_event_status_in(value)

    @staticmethod
    def filter_accepted(qs: ApplicationEventScheduleQuerySet, name: str, value: bool) -> QuerySet:
        return (
            qs.filter(
                declined=False,
                allocated_begin__isnull=False,
                allocated_end__isnull=False,
                allocated_day__isnull=False,
                allocated_reservation_unit__isnull=False,
            )
            if value
            else qs.filter(
                models.Q(declined=True)
                | models.Q(
                    allocated_begin__isnull=True,
                    allocated_end__isnull=True,
                    allocated_day__isnull=True,
                    allocated_reservation_unit__isnull=True,
                )
            )
        )

    @staticmethod
    def filter_unallocated(qs: ApplicationEventScheduleQuerySet, name: str, value: bool) -> QuerySet:
        return (
            qs.filter(
                declined=False,
                allocated_begin__isnull=True,
                allocated_end__isnull=True,
                allocated_day__isnull=True,
                allocated_reservation_unit__isnull=True,
            )
            if value
            else qs.filter(
                models.Q(declined=True)
                | models.Q(
                    declined=False,
                    allocated_begin__isnull=False,
                    allocated_end__isnull=False,
                    allocated_day__isnull=False,
                    allocated_reservation_unit__isnull=False,
                )
            )
        )

    @staticmethod
    def filter_text_search(qs: ApplicationEventScheduleQuerySet, name: str, value: str) -> QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        vector = SearchVector(
            "application_event__application__id",
            "application_event__id",
            "application_event__name",
            "applicant",
        )
        query = raw_prefixed_query(value)
        return qs.annotate(search=vector).filter(search=query)

    @staticmethod
    def order_by_allocated_time_of_week(qs: ApplicationEventScheduleQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_allocated_time_of_week(desc=desc)

    @staticmethod
    def order_by_application_status(qs: ApplicationEventScheduleQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_application_status(desc=desc)

    @staticmethod
    def order_by_application_event_status(qs: ApplicationEventScheduleQuerySet, desc: bool) -> QuerySet:
        return qs.order_by_application_event_status(desc=desc)
