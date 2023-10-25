from types import DynamicClassAttribute

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ApplicantTypeChoice",
    "ApplicationEventStatusChoice",
    "ApplicationRoundStatusChoice",
    "ApplicationStatusChoice",
    "CustomerTypeChoice",
    "OrganizationTypeChoice",
    "PriorityChoice",
    "TargetGroupChoice",
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


class PriorityChoice(models.IntegerChoices):
    LOW = 100, _("Low")
    MEDIUM = 200, _("Medium")
    HIGH = 300, _("High")


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "BUSINESS", _("Business")
    NONPROFIT = "NONPROFIT", _("Nonprofit")
    INDIVIDUAL = "INDIVIDUAL", _("Individual")


class ApplicantTypeChoice(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", _("Individual")
    ASSOCIATION = "ASSOCIATION", _("Association")
    COMMUNITY = "COMMUNITY", _("Community")
    COMPANY = "COMPANY", _("Company")


class ApplicationRoundStatusChoice(models.TextChoices):
    UPCOMING = "UPCOMING"
    """Applications cannot yet be made in the round"""

    OPEN = "OPEN"
    """Applications can be made in the round"""

    IN_ALLOCATION = "IN_ALLOCATION"
    """Applications in the round are being allocated"""

    HANDLED = "HANDLED"
    """All application have been allocated"""

    RESULTS_SENT = "SENT"
    """All application results have been sent to users"""

    @DynamicClassAttribute
    def is_allocation_upcoming(self) -> bool:
        return self in [
            ApplicationRoundStatusChoice.UPCOMING,
            ApplicationRoundStatusChoice.OPEN,
        ]


class ApplicationStatusChoice(models.TextChoices):
    DRAFT = "DRAFT"
    """Application started but not ready"""

    RECEIVED = "RECEIVED"
    """Application sent by user"""

    IN_ALLOCATION = "IN_ALLOCATION"
    """Application's events are being allocated"""

    HANDLED = "HANDLED"
    """Application's events have all been allocated"""

    RESULTS_SENT = "RESULT_SENT"
    """Application's results have been sent to user"""

    EXPIRED = "EXPIRED"
    """Application not completed before application round ended"""

    CANCELLED = "CANCELLED"
    """Application cancelled by user"""

    @DynamicClassAttribute
    def can_decline(self) -> bool:
        return self in [
            ApplicationStatusChoice.IN_ALLOCATION,
        ]

    @DynamicClassAttribute
    def can_approve(self) -> bool:
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


class ApplicationEventStatusChoice(models.TextChoices):
    UNALLOCATED = "UNALLOCATED", _("Unallocated")
    """Application event has been created by the user, but not yet allocated"""

    APPROVED = "APPROVED", _("Approved")
    """Application event has been approved in the allocation process"""

    DECLINED = "DECLINED", _("Declined")
    """Application event has been declined in the allocation process"""

    RESERVED = "RESERVED", _("Reserved")
    """All reservations for the application event have been created successfully"""

    FAILED = "FAILED", _("Failed")
    """Some or all reservations for the application event could not be created successfully"""

    @DynamicClassAttribute
    def can_decline(self) -> bool:
        return self in [
            ApplicationEventStatusChoice.UNALLOCATED,
            ApplicationEventStatusChoice.APPROVED,
            ApplicationEventStatusChoice.FAILED,
        ]

    @DynamicClassAttribute
    def can_approve(self) -> bool:
        return self == ApplicationEventStatusChoice.UNALLOCATED


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
