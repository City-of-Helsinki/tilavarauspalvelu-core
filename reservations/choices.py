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

    @classproperty
    def organisation(self) -> list[str]:
        return [  # type: ignore[return-value]
            CustomerTypeChoice.BUSINESS.value,
            CustomerTypeChoice.NONPROFIT.value,
        ]


class ReservationStateChoice(models.TextChoices):
    CREATED = "created", _("Created")
    CANCELLED = "cancelled", _("Cancelled")
    REQUIRES_HANDLING = "requires_handling", _("Requires handling")
    WAITING_FOR_PAYMENT = "waiting_for_payment", _("Waiting for payment")
    CONFIRMED = "confirmed", _("Confirmed")
    DENIED = "denied", _("Denied")

    @classproperty
    def states_going_to_occur(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
            ReservationStateChoice.REQUIRES_HANDLING.value,
        ]

    @classproperty
    def states_that_can_change_to_handling(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.CONFIRMED.value,
            ReservationStateChoice.DENIED.value,
        ]

    @classproperty
    def states_that_can_change_to_deny(self) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationStateChoice.REQUIRES_HANDLING.value,
            ReservationStateChoice.CONFIRMED.value,
        ]


class ReservationTypeChoice(models.TextChoices):
    NORMAL = "normal", _("Normal")
    BLOCKED = "blocked", _("Blocked")
    STAFF = "staff", _("Staff")
    BEHALF = "behalf", _("Behalf")
    SEASONAL = "seasonal", _("Seasonal")

    @classproperty
    def allowed_for_user_time_adjust(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.BEHALF.value,
        ]

    @classproperty
    def allowed_for_staff_create(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.BLOCKED.value,
            ReservationTypeChoice.STAFF.value,
            ReservationTypeChoice.BEHALF.value,
        ]


RESERVEE_LANGUAGE_CHOICES = (*settings.LANGUAGES, ("", ""))


class RejectionReadinessChoice(models.TextChoices):
    INTERVAL_NOT_ALLOWED = "INTERVAL_NOT_ALLOWED", _("Interval not allowed")
    OVERLAPPING_RESERVATIONS = "OVERLAPPING_RESERVATIONS", _("Overlapping reservations")
    RESERVATION_UNIT_CLOSED = "RESERVATION_UNIT_CLOSED", _("Reservation unit closed")
