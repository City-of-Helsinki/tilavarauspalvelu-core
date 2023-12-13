import django_filters
from django.contrib.postgres.search import SearchVector
from django.db.models import QuerySet

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

    text_search = django_filters.CharFilter(method="filter_text_search")

    order_by = django_filters.OrderingFilter(
        fields=[
            "pk",
            ("application_event__id", "application_event_id"),
            ("application_event__application__id", "application_id"),
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
