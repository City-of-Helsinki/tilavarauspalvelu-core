from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _

__all__ = [
    "CustomerTypeChoice",
    "ReservationStateChoice",
    "ReservationTypeChoice",
]


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "business", _("Business")
    NONPROFIT = "nonprofit", _("Nonprofit")
    INDIVIDUAL = "individual", _("Individual")


class ReservationStateChoice(models.TextChoices):
    CREATED = "created", _("Created")
    CANCELLED = "cancelled", _("Cancelled")
    REQUIRES_HANDLING = "requires_handling", _("Requires handling")
    WAITING_FOR_PAYMENT = "waiting_for_payment", _("Waiting for payment")
    CONFIRMED = "confirmed", _("Confirmed")
    DENIED = "denied", _("Denied")

    @classproperty
    def states_that_can_change_to_handling(self) -> list[ReservationStateChoice]:
        return [
            ReservationStateChoice.CONFIRMED,
            ReservationStateChoice.DENIED,
        ]

    @classproperty
    def states_that_can_change_to_deny(self) -> list[ReservationStateChoice]:
        return [
            ReservationStateChoice.REQUIRES_HANDLING,
            ReservationStateChoice.CONFIRMED,
        ]


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "normal", _("Normal")
    BLOCKED = "blocked", _("Blocked")
    STAFF = "staff", _("Staff")
    BEHALF = "behalf", _("Behalf")
    SEASONAL = "seasonal", _("Seasonal")

    @classproperty
    def allowed_for_staff_create(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.BEHALF.value,
        ]


RESERVEE_LANGUAGE_CHOICES = (*settings.LANGUAGES, ("", ""))
