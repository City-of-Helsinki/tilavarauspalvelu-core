import django_filters

from applications.choices import ApplicantTypeChoice, ApplicationEventStatusChoice, ApplicationStatusChoice
from applications.models import ApplicationEvent
from applications.querysets.application_event import ApplicationEventQuerySet
from common.filtersets import (
    BaseModelFilterSet,
    EnumChoiceFilter,
    EnumMultipleChoiceFilter,
    IntChoiceFilter,
    IntMultipleChoiceFilter,
)


class ApplicationEventFilterSet(BaseModelFilterSet):
    pk = IntMultipleChoiceFilter()
    user = IntChoiceFilter(field_name="application__user")
    application_round = IntChoiceFilter(field_name="application__application_round")
    reservation_unit = IntMultipleChoiceFilter(field_name="event_reservation_units__reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="event_reservation_units__reservation_unit__unit")

    applicant_type = EnumMultipleChoiceFilter(field_name="application__applicant_type", enum=ApplicantTypeChoice)
    status = EnumChoiceFilter(method="filter_by_status", enum=ApplicationEventStatusChoice)
    application_status = EnumChoiceFilter(method="filter_by_application_status", enum=ApplicationStatusChoice)

    order_by = django_filters.OrderingFilter(fields=["pk", "applicant", "name_fi", "name_en", "name_sv"])

    class Meta:
        model = ApplicationEvent
        fields = {
            "name": ["istartswith"],
            "application": ["exact"],
        }

    def filter_queryset(self, queryset: ApplicationEventQuerySet) -> ApplicationEventQuerySet:
        return super().filter_queryset(queryset.with_applicant_alias())

    @staticmethod
    def filter_by_status(qs: ApplicationEventQuerySet, name: str, value: str) -> ApplicationEventQuerySet:
        return qs.has_status(ApplicationEventStatusChoice(value))

    @staticmethod
    def filter_by_application_status(qs: ApplicationEventQuerySet, name: str, value: str) -> ApplicationEventQuerySet:
        return qs.has_application_status(ApplicationStatusChoice(value))
