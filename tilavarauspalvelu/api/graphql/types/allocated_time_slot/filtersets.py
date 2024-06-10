import django_filters
from django.contrib.postgres.search import SearchVector
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntChoiceFilter, IntMultipleChoiceFilter
from lookup_property import L

from applications.enums import ApplicantTypeChoice, ApplicationSectionStatusChoice, Weekday
from applications.models import AllocatedTimeSlot
from applications.querysets.allocated_time_slot import AllocatedTimeSlotQuerySet
from common.db import raw_prefixed_query

__all__ = [
    "AllocatedTimeSlotFilterSet",
]


class AllocatedTimeSlotFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    day_of_the_week = EnumMultipleChoiceFilter(enum=Weekday)
    application_round = IntChoiceFilter(
        field_name="reservation_unit_option__application_section__application__application_round",
    )
    application_section_status = EnumMultipleChoiceFilter(
        method="filter_by_section_status",
        enum=ApplicationSectionStatusChoice,
    )
    applicant_type = EnumMultipleChoiceFilter(
        field_name="reservation_unit_option__application_section__application__applicant_type",
        enum=ApplicantTypeChoice,
    )
    allocated_unit = IntMultipleChoiceFilter(field_name="reservation_unit_option__reservation_unit__unit")
    allocated_reservation_unit = IntMultipleChoiceFilter(field_name="reservation_unit_option__reservation_unit")

    text_search = django_filters.CharFilter(method="filter_text_search")

    class Meta:
        model = AllocatedTimeSlot
        order_by = [
            "pk",
            ("reservation_unit_option__application_section__pk", "application_section_pk"),
            ("reservation_unit_option__application_section__application__pk", "application_pk"),
            ("reservation_unit_option__application_section__name", "application_section_name"),
            ("reservation_unit_option__reservation_unit__unit__name_fi", "allocated_unit_name_fi"),
            ("reservation_unit_option__reservation_unit__unit__name_en", "allocated_unit_name_en"),
            ("reservation_unit_option__reservation_unit__unit__name_sv", "allocated_unit_name_sv"),
            ("reservation_unit_option__reservation_unit__name_fi", "allocated_reservation_unit_name_fi"),
            ("reservation_unit_option__reservation_unit__name_en", "allocated_reservation_unit_name_en"),
            ("reservation_unit_option__reservation_unit__name_sv", "allocated_reservation_unit_name_sv"),
            "allocated_time_of_week",
            "applicant",
            "day_of_the_week",
            "application_status",
            "application_section_status",
        ]

    @staticmethod
    def filter_by_section_status(qs: AllocatedTimeSlotQuerySet, name: str, value: list[str]) -> models.QuerySet:
        return qs.has_section_status_in(value)

    @staticmethod
    def filter_text_search(qs: AllocatedTimeSlotQuerySet, name: str, value: str) -> models.QuerySet:
        # If this becomes slow, look into optimisation strategies here:
        # https://docs.djangoproject.com/en/4.2/ref/contrib/postgres/search/#performance
        vector = SearchVector(
            "reservation_unit_option__application_section__id",
            "reservation_unit_option__application_section__name",
            "reservation_unit_option__application_section__application__id",
            "applicant",
        )
        query = raw_prefixed_query(value)
        return (
            qs.alias(applicant=L("reservation_unit_option__application_section__application__applicant"))
            .annotate(search=vector)
            .filter(search=query)
        )

    @staticmethod
    def order_by_allocated_time_of_week(qs: AllocatedTimeSlotQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_allocated_time_of_week(desc=desc)

    @staticmethod
    def order_by_application_status(qs: AllocatedTimeSlotQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_application_status(desc=desc)

    @staticmethod
    def order_by_application_section_status(qs: AllocatedTimeSlotQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_application_section_status(desc=desc)

    @staticmethod
    def order_by_applicant(qs: AllocatedTimeSlotQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_applicant(desc=desc)

    @staticmethod
    def order_by_day_of_the_week(qs: AllocatedTimeSlotQuerySet, desc: bool) -> models.QuerySet:
        return qs.order_by_day_of_the_week(desc=desc)
