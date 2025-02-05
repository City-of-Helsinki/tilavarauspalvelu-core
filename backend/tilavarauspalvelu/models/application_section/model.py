from __future__ import annotations

import datetime
import uuid
from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import OrderBy
from django.db.models.functions import Coalesce
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, Weekday
from utils.date_utils import local_datetime
from utils.db import NowTT, SubqueryCount

from .queryset import ApplicationSectionManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AgeGroup, Application, ReservationPurpose

    from .actions import ApplicationSectionActions


__all__ = [
    "ApplicationSection",
]


class ApplicationSection(SerializableMixin, models.Model):
    """
    Represents a section of an application, which contains the reservation unit options
    and suitable time ranges that can be used fulfill the slot request included in it.
    """

    ext_uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # ID for external systems

    name: str = models.CharField(max_length=100)
    num_persons: int = models.PositiveIntegerField()
    reservations_begin_date: datetime.date = models.DateField()
    reservations_end_date: datetime.date = models.DateField()

    # Slot request
    reservation_min_duration: datetime.timedelta = models.DurationField()
    reservation_max_duration: datetime.timedelta = models.DurationField()
    applied_reservations_per_week: int = models.PositiveIntegerField()

    application: Application = models.ForeignKey(
        "tilavarauspalvelu.Application",
        related_name="application_sections",
        on_delete=models.CASCADE,
    )
    purpose: ReservationPurpose | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationPurpose",
        related_name="application_sections",
        on_delete=models.SET_NULL,
        null=True,
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        related_name="application_sections",
        on_delete=models.SET_NULL,
        null=True,
    )

    objects = ApplicationSectionManager()

    class Meta:
        db_table = "application_section"
        base_manager_name = "objects"
        verbose_name = _("application section")
        verbose_name_plural = _("application sections")
        ordering = ["pk"]
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
                    reservation_min_duration__in=[
                        datetime.timedelta(minutes=minutes) for minutes in range(30, 1441, 30)
                    ],
                    reservation_max_duration__in=[
                        datetime.timedelta(minutes=minutes) for minutes in range(30, 1441, 30)
                    ],
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

    @cached_property
    def actions(self) -> ApplicationSectionActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ApplicationSectionActions

        return ApplicationSectionActions(self)

    @property
    def suitable_days_of_the_week(self) -> list[Weekday]:
        suitable = (
            self.suitable_time_ranges.distinct()
            .order_by(OrderBy(L("day_of_the_week_number")))
            .values_list("day_of_the_week", flat=True)
        )
        return [Weekday(day) for day in suitable]

    @lookup_property(joins=["application"], skip_codegen=True)
    def status() -> ApplicationSectionStatusChoice:
        return models.Case(  # type: ignore[return-value]
            models.When(
                # The application round has not yet moved to the allocation stage
                models.Q(application__application_round__application_period_end__gte=NowTT()),
                then=models.Value(ApplicationSectionStatusChoice.UNALLOCATED.value),
            ),
            models.When(
                # Application Section has no allocations
                #  AND Application round has moved to handled stage
                #  OR all reservation unit options have been rejected
                condition=(
                    models.Q(
                        L(allocations=0)
                        & (
                            models.Q(application__application_round__handled_date__isnull=False)
                            | L(usable_reservation_unit_options=0)
                        )
                    )
                ),
                then=models.Value(ApplicationSectionStatusChoice.REJECTED.value),
            ),
            models.When(
                # The number of allocations equals the number of applied reservations per week
                # OR Section has at least one allocation
                #   AND Application round has moved to handled stage
                #   OR all reservation unit options have been rejected
                condition=(
                    L(allocations__gte=models.F("applied_reservations_per_week"))
                    | (
                        L(allocations__gt=0)
                        & (
                            models.Q(application__application_round__handled_date__isnull=False)
                            | L(usable_reservation_unit_options=0)
                        )
                    )
                ),
                then=models.Value(ApplicationSectionStatusChoice.HANDLED.value),
            ),
            # Otherwise, the section is still in allocation
            default=models.Value(ApplicationSectionStatusChoice.IN_ALLOCATION.value),
            output_field=models.CharField(),
        )

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

        if total_allocations >= self.applied_reservations_per_week:
            return ApplicationSectionStatusChoice.HANDLED

        is_application_round_handled = self.application.application_round.handled_date is not None
        if is_application_round_handled or all_locked_or_rejected:
            if total_allocations > 0:
                return ApplicationSectionStatusChoice.HANDLED
            return ApplicationSectionStatusChoice.REJECTED

        return ApplicationSectionStatusChoice.IN_ALLOCATION

    @lookup_property(skip_codegen=True)
    def allocations() -> int:
        from tilavarauspalvelu.models import AllocatedTimeSlot

        return Coalesce(  # type: ignore[return-value]
            SubqueryCount(
                queryset=(
                    AllocatedTimeSlot.objects.filter(
                        reservation_unit_option__application_section=models.OuterRef("id")
                    ).values("id")
                )
            ),
            models.Value(0),
        )

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
        from tilavarauspalvelu.models import ReservationUnitOption

        return Coalesce(  # type: ignore[return-value]
            SubqueryCount(
                queryset=(
                    ReservationUnitOption.objects.filter(application_section=models.OuterRef("pk"))
                    .filter(rejected=False, locked=False)
                    .values("id")
                )
            ),
            models.Value(0),
        )

    @usable_reservation_unit_options.override
    def _(self) -> int:
        return self.reservation_unit_options.filter(rejected=False, locked=False).count()

    @lookup_property
    def status_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.UNALLOCATED.value)),
                then=models.Value(1),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.IN_ALLOCATION.value)),
                then=models.Value(2),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.REJECTED.value)),
                then=models.Value(3),
            ),
            models.When(
                models.Q(L(status=ApplicationSectionStatusChoice.HANDLED.value)),
                then=models.Value(4),
            ),
            default=models.Value(5),
            output_field=models.IntegerField(),
        )
