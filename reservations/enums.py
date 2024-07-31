from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import pgettext_lazy

__all__ = [
    "CustomerTypeChoice",
    "ReservationStateChoice",
    "ReservationTypeChoice",
]


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "business", pgettext_lazy("CustomerType", "Business")
    NONPROFIT = "nonprofit", pgettext_lazy("CustomerType", "Nonprofit")
    INDIVIDUAL = "individual", pgettext_lazy("CustomerType", "Individual")

    @classproperty
    def organisation(self) -> list[str]:
        return [  # type: ignore[return-value]
            CustomerTypeChoice.BUSINESS.value,
            CustomerTypeChoice.NONPROFIT.value,
        ]


class ReservationStateChoice(models.TextChoices):
    CREATED = "created", pgettext_lazy("ReservationState", "Created")
    CANCELLED = "cancelled", pgettext_lazy("ReservationState", "Cancelled")
    REQUIRES_HANDLING = "requires_handling", pgettext_lazy("ReservationState", "Requires handling")
    WAITING_FOR_PAYMENT = "waiting_for_payment", pgettext_lazy("ReservationState", "Waiting for payment")
    CONFIRMED = "confirmed", pgettext_lazy("ReservationState", "Confirmed")
    DENIED = "denied", pgettext_lazy("ReservationState", "Denied")

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
    NORMAL = "normal", pgettext_lazy("ReservationType", "Normal")
    BLOCKED = "blocked", pgettext_lazy("ReservationType", "Blocked")
    STAFF = "staff", pgettext_lazy("ReservationType", "Staff")
    BEHALF = "behalf", pgettext_lazy("ReservationType", "Behalf")
    SEASONAL = "seasonal", pgettext_lazy("ReservationType", "Seasonal")

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
    INTERVAL_NOT_ALLOWED = (
        "INTERVAL_NOT_ALLOWED",
        pgettext_lazy("RejectionReadiness", "Interval not allowed"),
    )
    OVERLAPPING_RESERVATIONS = (
        "OVERLAPPING_RESERVATIONS",
        pgettext_lazy("RejectionReadiness", "Overlapping reservations"),
    )
    RESERVATION_UNIT_CLOSED = (
        "RESERVATION_UNIT_CLOSED",
        pgettext_lazy("RejectionReadiness", "Reservation unit closed"),
    )
