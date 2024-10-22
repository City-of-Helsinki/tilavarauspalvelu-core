from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, Priority, Weekday
from utils.fields.model import StrChoiceField

from .queryset import SuitableTimeRangeManager

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ApplicationSection

    from .actions import SuitableTimeRangeActions


__all__ = [
    "SuitableTimeRange",
]


class SuitableTimeRange(models.Model):
    """Represent a time range that the applicant has marked as suitable for their application section."""

    priority: str = StrChoiceField(enum=Priority)
    day_of_the_week: str = StrChoiceField(enum=Weekday)
    begin_time: datetime.time = models.TimeField()
    end_time: datetime.time = models.TimeField()

    application_section: ApplicationSection = models.ForeignKey(
        "tilavarauspalvelu.ApplicationSection",
        related_name="suitable_time_ranges",
        on_delete=models.CASCADE,
    )

    objects = SuitableTimeRangeManager()

    class Meta:
        db_table = "suitable_time_range"
        base_manager_name = "objects"
        verbose_name = _("suitable time range")
        verbose_name_plural = _("suitable time ranges")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(begin_time__lt=models.F("end_time"))  # begin before end
                    | (
                        models.Q(end_time__hour=0)  # end at midnight, but start not
                        & ~models.Q(begin_time__hour=0)
                    )
                ),
                name="begin_time_before_end_time_suitable",
                violation_error_message=_("Begin time must be before end time."),
            ),
            models.CheckConstraint(
                check=models.Q(begin_time__minute=0, end_time__minute=0),
                name="begin_and_end_time_multiple_of_60_minutes_suitable",
                violation_error_message=_("Begin and end times must be a multiples of 60 minutes."),
            ),
        ]

    def __str__(self) -> str:
        return f"{self.day_of_the_week} {self.begin_time.isoformat()}-{self.end_time.isoformat()}"

    @cached_property
    def actions(self) -> SuitableTimeRangeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import SuitableTimeRangeActions

        return SuitableTimeRangeActions(self)

    @lookup_property(joins=["application_section"], skip_codegen=True)
    def fulfilled() -> bool:
        from tilavarauspalvelu.models import AllocatedTimeSlot

        return models.Case(  # type: ignore[return-value]
            models.When(
                ~models.Q(
                    L(
                        application_section__status__in=[
                            ApplicationSectionStatusChoice.UNALLOCATED,
                            ApplicationSectionStatusChoice.IN_ALLOCATION,
                        ]
                    )
                ),
                then=models.Value(True),
            ),
            default=models.Exists(
                AllocatedTimeSlot.objects.filter(
                    day_of_the_week=models.OuterRef("day_of_the_week"),
                    reservation_unit_option__application_section=models.OuterRef("application_section"),
                )
            ),
            output_field=models.BooleanField(),
        )

    @fulfilled.override
    def _(self) -> bool:
        if not self.application_section.status.can_allocate:
            return True

        from tilavarauspalvelu.models import AllocatedTimeSlot

        return AllocatedTimeSlot.objects.filter(
            day_of_the_week=self.day_of_the_week,
            reservation_unit_option__application_section=self.application_section,
        ).exists()

    @lookup_property
    def day_of_the_week_number() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(day_of_the_week=Weekday.MONDAY.value, then=models.Value(1)),
            models.When(day_of_the_week=Weekday.TUESDAY.value, then=models.Value(2)),
            models.When(day_of_the_week=Weekday.WEDNESDAY.value, then=models.Value(3)),
            models.When(day_of_the_week=Weekday.THURSDAY.value, then=models.Value(4)),
            models.When(day_of_the_week=Weekday.FRIDAY.value, then=models.Value(5)),
            models.When(day_of_the_week=Weekday.SATURDAY.value, then=models.Value(6)),
            models.When(day_of_the_week=Weekday.SUNDAY.value, then=models.Value(7)),
            default=models.Value(8),
            output_field=models.IntegerField(),
        )
