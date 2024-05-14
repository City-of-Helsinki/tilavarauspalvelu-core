from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Manager, OrderBy
from django.db.models.functions import Coalesce, Now
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L, lookup_property

from applications.choices import ApplicationSectionStatusChoice, Weekday
from applications.querysets.application_section import ApplicationSectionQuerySet
from common.connectors import ApplicationSectionActionsConnector
from common.date_utils import local_datetime
from common.db import SubqueryCount

if TYPE_CHECKING:
    from applications.models import Application
    from reservations.models import AgeGroup, ReservationPurpose

__all__ = [
    "ApplicationSection",
]


@dataclass
class SlotRequest:
    reservation_min_duration: timedelta
    reservation_max_duration: timedelta
    applied_reservations_per_week: int
    suitable_days_of_the_week: list[str]


class ApplicationSectionManager(
    SerializableMixin.SerializableManager,
    Manager.from_queryset(ApplicationSectionQuerySet),
):
    """Contains custom queryset methods and GDPR serialization."""


class ApplicationSection(SerializableMixin, models.Model):
    """
    Represents a section of an application, which contains the reservation unit options
    and suitable time ranges that can be used fulfill the slot request included in it.
    """

    name: str = models.CharField(max_length=100)
    num_persons: int = models.PositiveIntegerField()
    reservations_begin_date: date = models.DateField()
    reservations_end_date: date = models.DateField()

    # Slot request
    reservation_min_duration: timedelta = models.DurationField()
    reservation_max_duration: timedelta = models.DurationField()
    applied_reservations_per_week: int = models.PositiveIntegerField()

    application: Application = models.ForeignKey(
        "applications.Application",
        on_delete=models.CASCADE,
        related_name="application_sections",
    )
    # TODO: These should be required, but nullable since the
    # purposes and age groups might get deleted, and the application
    # section should still remain in the database
    purpose: ReservationPurpose | None = models.ForeignKey(
        "reservations.ReservationPurpose",
        null=True,
        on_delete=models.SET_NULL,
        related_name="application_sections",
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        on_delete=models.SET_NULL,
        related_name="application_sections",
    )

    objects = ApplicationSectionManager()
    actions = ApplicationSectionActionsConnector()

    class Meta:
        db_table = "application_section"
        base_manager_name = "objects"
        verbose_name = _("Application Section")
        verbose_name_plural = _("Application Sections")
        ordering = [
            "pk",
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(reservations_begin_date__lte=models.F("reservations_end_date")),
                name="begin_date_before_end_date",
                violation_error_message=_("Reservations begin date must be before reservations end date."),
            ),
            models.CheckConstraint(
                check=models.Q(reservation_min_duration__lte=models.F("reservation_max_duration")),
                name="min_duration_not_greater_than_max_duration",
                violation_error_message=_("Reservation min duration cannot be greater than reservation max duration."),
            ),
            models.CheckConstraint(
                check=models.Q(applied_reservations_per_week__gte=1, applied_reservations_per_week__lte=7),
                name="applied_reservations_per_week_from_1_to_7",
                violation_error_message=_("Can only apply from 1 to 7 reservations per week."),
            ),
            models.CheckConstraint(
                check=models.Q(
                    # 1440 minutes = 24 hours (1 extra minute to include 24 hours exactly)
                    reservation_min_duration__in=[timedelta(minutes=minutes) for minutes in range(30, 1441, 30)],
                    reservation_max_duration__in=[timedelta(minutes=minutes) for minutes in range(30, 1441, 30)],
                ),
                name="durations_multiple_of_30_minutes_max_24_hours",
                violation_error_message=_(
                    "Reservation min and max durations must be multiples of 30 minutes, up to a maximum of 24 hours."
                ),
            ),
        ]

    # For GDPR API
    serialize_fields = ({"name": "name"},)

    def __str__(self) -> str:
        return self.name

    @property
    def slot_request(self) -> SlotRequest:
        return SlotRequest(
            reservation_min_duration=self.reservation_min_duration,
            reservation_max_duration=self.reservation_max_duration,
            applied_reservations_per_week=self.applied_reservations_per_week,
            suitable_days_of_the_week=self.suitable_days_of_the_week,
        )

    @property
    def suitable_days_of_the_week(self) -> list[Weekday]:
        suitable = (
            self.suitable_time_ranges.distinct()
            .order_by(OrderBy(L("day_of_the_week_number")))
            .values_list("day_of_the_week", flat=True)
        )
        return [Weekday(day) for day in suitable]

    @lookup_property(joins=["reservation_unit_options", "application"], skip_codegen=True)
    def status() -> ApplicationSectionStatusChoice:
        status = models.Case(
            models.When(
                # The application round has not yet moved to the allocation stage
                models.Q(application__application_round__application_period_end__gte=Now()),
                then=models.Value(ApplicationSectionStatusChoice.UNALLOCATED.value),
            ),
            models.When(
                # Application round has moved to handled stage
                # OR number of allocations equals the number of applied reservations per week
                # OR all reservation unit options have been locked or rejected
                condition=(
                    models.Q(application__application_round__handled_date__isnull=False)
                    | models.Q(L(allocations__gte=models.F("applied_reservations_per_week")))
                    | models.Q(L(usable_reservation_unit_options=0))
                ),
                then=models.Value(ApplicationSectionStatusChoice.HANDLED.value),
            ),
            # Otherwise, the section is still in allocation
            default=models.Value(ApplicationSectionStatusChoice.IN_ALLOCATION.value),
            output_field=models.CharField(),
        )
        return status  # type: ignore[return-value]

    @status.override
    def _(self) -> ApplicationSectionStatusChoice:
        if self.application.application_round.application_period_end > local_datetime():
            return ApplicationSectionStatusChoice.UNALLOCATED

        reservation_unit_options = list(
            self.reservation_unit_options.annotate(
                num_of_allocations=Coalesce(
                    models.Count("allocated_time_slots"),
                    models.Value(0),
                ),
            ).all()
        )
        total_allocations = sum(option.num_of_allocations for option in reservation_unit_options)
        all_locked_or_rejected = all(option.locked or option.rejected for option in reservation_unit_options)

        if self.application.application_round.status.past_allocation:
            return ApplicationSectionStatusChoice.HANDLED
        if total_allocations >= self.applied_reservations_per_week:
            return ApplicationSectionStatusChoice.HANDLED
        if all_locked_or_rejected:
            return ApplicationSectionStatusChoice.HANDLED

        return ApplicationSectionStatusChoice.IN_ALLOCATION

    @lookup_property(skip_codegen=True)
    def allocations() -> int:
        from .allocated_time_slot import AllocatedTimeSlot

        allocations = Coalesce(
            SubqueryCount(
                queryset=(
                    AllocatedTimeSlot.objects.filter(
                        reservation_unit_option__application_section=models.OuterRef("id")
                    ).values("id")
                )
            ),
            models.Value(0),
        )
        return allocations  # type: ignore[return-value]

    @allocations.override
    def _(self) -> int:
        return sum(
            self.reservation_unit_options.annotate(
                num_of_allocations=Coalesce(
                    models.Count("allocated_time_slots"),
                    models.Value(0),
                ),
            ).values_list("num_of_allocations", flat=True)
        )

    @lookup_property(skip_codegen=True)
    def usable_reservation_unit_options() -> int:
        from .reservation_unit_option import ReservationUnitOption

        usable_reservation_unit_options = Coalesce(
            SubqueryCount(
                queryset=(
                    ReservationUnitOption.objects.filter(application_section=models.OuterRef("pk"))
                    .filter(rejected=False, locked=False)
                    .values("id")
                )
            ),
            models.Value(0),
        )
        return usable_reservation_unit_options  # type: ignore[return-value]

    @usable_reservation_unit_options.override
    def _(self) -> int:
        return self.reservation_unit_options.filter(rejected=False, locked=False).count()

    @lookup_property
    def status_sort_order() -> int:
        status_sort_order = models.Case(
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.UNALLOCATED.value)),
                then=models.Value(1),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION.value)),
                then=models.Value(2),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.HANDLED.value)),
                then=models.Value(3),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.FAILED.value)),
                then=models.Value(4),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.RESERVED.value)),
                then=models.Value(5),
            ),
            default=models.Value(6),
            output_field=models.IntegerField(),
        )
        return status_sort_order  # type: ignore[return-value]
