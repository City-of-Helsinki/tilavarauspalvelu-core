from __future__ import annotations

from types import DynamicClassAttribute
from typing import Literal

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ApplicantTypeChoice",
    "ApplicationRoundStatusChoice",
    "ApplicationSectionStatusChoice",
    "ApplicationStatusChoice",
    "OrganizationTypeChoice",
    "Priority",
    "TargetGroupChoice",
    "Weekday",
    "WeekdayChoice",
]


class WeekdayChoice(models.IntegerChoices):
    MONDAY = 0, _("Monday")
    TUESDAY = 1, _("Tuesday")
    WEDNESDAY = 2, _("Wednesday")
    THURSDAY = 3, _("Thursday")
    FRIDAY = 4, _("Friday")
    SATURDAY = 5, _("Saturday")
    SUNDAY = 6, _("Sunday")


class Weekday(models.TextChoices):
    MONDAY = "MONDAY", _("Monday")
    TUESDAY = "TUESDAY", _("Tuesday")
    WEDNESDAY = "WEDNESDAY", _("Wednesday")
    THURSDAY = "THURSDAY", _("Thursday")
    FRIDAY = "FRIDAY", _("Friday")
    SATURDAY = "SATURDAY", _("Saturday")
    SUNDAY = "SUNDAY", _("Sunday")

    @classmethod
    def from_iso_week_day(cls, weekday: Literal[1, 2, 3, 4, 5, 6, 7]) -> Weekday:
        """ISO weekday number, starting from 1."""
        match weekday:
            case 1:
                return Weekday.MONDAY
            case 2:
                return Weekday.TUESDAY
            case 3:
                return Weekday.WEDNESDAY
            case 4:
                return Weekday.THURSDAY
            case 5:
                return Weekday.FRIDAY
            case 6:
                return Weekday.SATURDAY

    @classmethod
    def from_week_day(cls, weekday: Literal[0, 1, 2, 3, 4, 5, 6]) -> Weekday:
        """Weekday number, starting from 0."""
        match weekday:
            case 0:
                return Weekday.MONDAY
            case 1:
                return Weekday.TUESDAY
            case 2:
                return Weekday.WEDNESDAY
            case 3:
                return Weekday.THURSDAY
            case 4:
                return Weekday.FRIDAY
            case 5:
                return Weekday.SATURDAY
            case 6:
                return Weekday.SUNDAY

    @DynamicClassAttribute
    def as_iso_weekday_number(self) -> int:
        """ISO weekday number, starting from 1."""
        match self:
            case Weekday.MONDAY:
                return 1
            case Weekday.TUESDAY:
                return 2
            case Weekday.WEDNESDAY:
                return 3
            case Weekday.THURSDAY:
                return 4
            case Weekday.FRIDAY:
                return 5
            case Weekday.SATURDAY:
                return 6
            case Weekday.SUNDAY:
                return 7

    @DynamicClassAttribute
    def as_weekday_number(self) -> int:
        """Weekday number, starting from 0."""
        match self:
            case Weekday.MONDAY:
                return 0
            case Weekday.TUESDAY:
                return 1
            case Weekday.WEDNESDAY:
                return 2
            case Weekday.THURSDAY:
                return 3
            case Weekday.FRIDAY:
                return 4
            case Weekday.SATURDAY:
                return 5
            case Weekday.SUNDAY:
                return 6


class Priority(models.TextChoices):
    PRIMARY = "PRIMARY", _("Primary")
    SECONDARY = "SECONDARY", _("Secondary")


class ApplicantTypeChoice(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", _("Individual")
    ASSOCIATION = "ASSOCIATION", _("Association")
    COMMUNITY = "COMMUNITY", _("Community")
    COMPANY = "COMPANY", _("Company")


class ApplicationRoundStatusChoice(models.TextChoices):
    UPCOMING = "UPCOMING", _("Upcoming")
    """Applications cannot yet be made in the round"""

    OPEN = "OPEN", _("Open")
    """Applications can be made in the round"""

    IN_ALLOCATION = "IN_ALLOCATION", _("In Allocation")
    """Applications in the round are being allocated"""

    HANDLED = "HANDLED", _("Handled")
    """All application have been allocated"""

    RESULTS_SENT = "SENT", _("Results Sent")
    """All application results have been sent to users"""

    @DynamicClassAttribute
    def is_allocation_upcoming(self) -> bool:
        return self in [
            ApplicationRoundStatusChoice.UPCOMING,
            ApplicationRoundStatusChoice.OPEN,
        ]

    @DynamicClassAttribute
    def can_remove_allocations(self) -> bool:
        return self == ApplicationRoundStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def past_allocation(self) -> bool:
        return self in [
            ApplicationRoundStatusChoice.HANDLED,
            ApplicationRoundStatusChoice.RESULTS_SENT,
        ]

    @DynamicClassAttribute
    def is_ongoing(self) -> bool:
        return self != ApplicationRoundStatusChoice.RESULTS_SENT

    @DynamicClassAttribute
    def allows_resetting(self) -> bool:
        return self in [
            ApplicationRoundStatusChoice.IN_ALLOCATION,
            ApplicationRoundStatusChoice.HANDLED,
        ]


class ApplicationRoundReservationCreationStatusChoice(models.TextChoices):
    NOT_COMPLETED = "NOT_COMPLETED", _("Not completed")
    """The ApplicationRound has not been marked as completed yet or the reservations have not been created yet"""

    COMPLETED = "COMPLETED", _("Completed")
    """All reservations for the ApplicationRound have been created successfully"""

    FAILED = "FAILED", _("Failed")
    """Reservations for the ApplicationRound could not be created successfully or reservation creation has timed out"""


class ApplicationStatusChoice(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    """Application started but not ready"""

    RECEIVED = "RECEIVED", _("Received")
    """Application sent by user"""

    IN_ALLOCATION = "IN_ALLOCATION", _("In Allocation")
    """Application's events are being allocated"""

    HANDLED = "HANDLED", _("Handled")
    """Application's events have all been allocated"""

    RESULTS_SENT = "RESULT_SENT", _("Results Sent")
    """Application's results have been sent to user"""

    EXPIRED = "EXPIRED", _("Expired")
    """Application not completed before application round ended"""

    CANCELLED = "CANCELLED", _("Cancelled")
    """Application cancelled by user"""

    @DynamicClassAttribute
    def can_decline(self) -> bool:
        return self == ApplicationStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def can_allocate(self) -> bool:
        return self == ApplicationStatusChoice.IN_ALLOCATION

    @DynamicClassAttribute
    def can_send(self):
        return self in [
            ApplicationStatusChoice.DRAFT,
            ApplicationStatusChoice.RECEIVED,
        ]

    @DynamicClassAttribute
    def can_cancel(self):
        return self in [
            ApplicationStatusChoice.DRAFT,
            ApplicationStatusChoice.RECEIVED,
        ]

    @DynamicClassAttribute
    def can_flag(self) -> bool:
        return self in [
            ApplicationStatusChoice.IN_ALLOCATION,
            ApplicationStatusChoice.HANDLED,
            ApplicationStatusChoice.RESULTS_SENT,
        ]

    @DynamicClassAttribute
    def can_reset(self) -> bool:
        return self in [
            ApplicationStatusChoice.IN_ALLOCATION,
            ApplicationStatusChoice.HANDLED,
        ]


class ApplicationSectionStatusChoice(models.TextChoices):
    UNALLOCATED = "UNALLOCATED", _("Unallocated")
    """Application sections has been created by the user, but it hasn't been allocated"""

    IN_ALLOCATION = "IN_ALLOCATION", _("In Allocation")
    """Some allocations have been made for the application section, but allocation is not finished"""

    HANDLED = "HANDLED", _("Handled")
    """Application section has been handled fully in the allocation process"""

    RESERVED = "RESERVED", _("Reserved")
    """All reservations for the application section have been created successfully"""

    FAILED = "FAILED", _("Failed")
    """Some or all reservations for the application section could not be created successfully"""

    @DynamicClassAttribute
    def can_allocate(self) -> bool:
        return self in [
            ApplicationSectionStatusChoice.UNALLOCATED,
            ApplicationSectionStatusChoice.IN_ALLOCATION,
        ]

    @DynamicClassAttribute
    def can_delete(self) -> bool:
        return self == ApplicationSectionStatusChoice.UNALLOCATED

    @DynamicClassAttribute
    def can_reset(self) -> bool:
        return self in [
            ApplicationSectionStatusChoice.UNALLOCATED,
            ApplicationSectionStatusChoice.IN_ALLOCATION,
            ApplicationSectionStatusChoice.HANDLED,
        ]


class TargetGroupChoice(models.TextChoices):
    INTERNAL = "INTERNAL", _("Internal")
    PUBLIC = "PUBLIC", _("Public")
    ALL = "ALL", _("All")


class OrganizationTypeChoice(models.TextChoices):
    COMPANY = "COMPANY", _("Company")
    REGISTERED_ASSOCIATION = "REGISTERED_ASSOCIATION", _("Registered association")
    PUBLIC_ASSOCIATION = "PUBLIC_ASSOCIATION", _("Public association")
    UNREGISTERED_ASSOCIATION = "UNREGISTERED_ASSOCIATION", _("Unregistered association")
    MUNICIPALITY_CONSORTIUM = "MUNICIPALITY_CONSORTIUM", _("Municipality consortium")
    RELIGIOUS_COMMUNITY = "RELIGIOUS_COMMUNITY", _("Religious community")
