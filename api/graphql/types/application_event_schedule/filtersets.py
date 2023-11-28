import django_filters
from django.db.models import QuerySet

from applications.choices import ApplicationEventStatusChoice
from applications.models import ApplicationEventSchedule
from applications.querysets.application_event_schedule import ApplicationEventScheduleQuerySet
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

    @staticmethod
    def filter_by_event_status(qs: ApplicationEventScheduleQuerySet, name: str, value: list[str]) -> QuerySet:
        return qs.has_event_status_in(value)
