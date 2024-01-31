from types import DynamicClassAttribute
from typing import TYPE_CHECKING, Optional

from django.db import models
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from email_notification.models import EmailType


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "BUSINESS", _("Business")
    NONPROFIT = "NONPROFIT", _("Nonprofit")
    INDIVIDUAL = "INDIVIDUAL", _("Individual")


class ReservationStateChoice(models.TextChoices):
    CREATED = "CREATED", _("Created")
    CANCELLED = "CANCELLED", _("Cancelled")
    REQUIRES_HANDLING = "REQUIRES_HANDLING", _("Requires handling")
    WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", _("Waiting for payment")
    CONFIRMED = "CONFIRMED", _("Confirmed")
    DENIED = "DENIED", _("Denied")

    @DynamicClassAttribute
    def email_type(self) -> Optional["EmailType"]:
        from email_notification.models import EmailType

        if self == ReservationStateChoice.CANCELLED:
            return EmailType.RESERVATION_CANCELLED
        if self == ReservationStateChoice.REQUIRES_HANDLING:
            return EmailType.HANDLING_REQUIRED_RESERVATION
        if self == ReservationStateChoice.WAITING_FOR_PAYMENT:
            return EmailType.RESERVATION_NEEDS_TO_BE_PAID
        if self == ReservationStateChoice.CONFIRMED:
            return EmailType.RESERVATION_CONFIRMED
        if self == ReservationStateChoice.DENIED:
            return EmailType.RESERVATION_REJECTED

        return None


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "NORMAL", _("Normal")
    BLOCKED = "BLOCKED", _("Blocked")
    STAFF = "STAFF", _("Staff")
    BEHALF = "BEHALF", _("Behalf")
