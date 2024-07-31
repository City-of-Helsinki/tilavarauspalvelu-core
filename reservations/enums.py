from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import pgettext_lazy

__all__ = [
    "CustomerTypeChoice",
    "ReservationStateChoice",
    "ReservationTypeChoice",
    "ReservationTypeStaffChoice",
]


class CustomerTypeChoice(models.TextChoices):
    BUSINESS = "BUSINESS", pgettext_lazy("CustomerType", "Business")
    NONPROFIT = "NONPROFIT", pgettext_lazy("CustomerType", "Nonprofit")
    INDIVIDUAL = "INDIVIDUAL", pgettext_lazy("CustomerType", "Individual")

    @classproperty
    def organisation(self) -> list[str]:
        return [  # type: ignore[return-value]
            CustomerTypeChoice.BUSINESS.value,
            CustomerTypeChoice.NONPROFIT.value,
        ]


class ReservationStateChoice(models.TextChoices):
    CREATED = "CREATED", pgettext_lazy("ReservationState", "Created")
    CANCELLED = "CANCELLED", pgettext_lazy("ReservationState", "Cancelled")
    REQUIRES_HANDLING = "REQUIRES_HANDLING", pgettext_lazy("ReservationState", "Requires handling")
    WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", pgettext_lazy("ReservationState", "Waiting for payment")
    CONFIRMED = "CONFIRMED", pgettext_lazy("ReservationState", "Confirmed")
    DENIED = "DENIED", pgettext_lazy("ReservationState", "Denied")

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
    NORMAL = "NORMAL", pgettext_lazy("ReservationType", "Normal")
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationType", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationType", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationType", "Behalf")
    SEASONAL = "SEASONAL", pgettext_lazy("ReservationType", "Seasonal")

    @classproperty
    def allowed_for_user_time_adjust(cls) -> list[str]:
        return [  # type: ignore[return-type]
            ReservationTypeChoice.NORMAL.value,
            ReservationTypeChoice.BEHALF.value,
        ]


class ReservationTypeStaffChoice(models.TextChoices):
    # These are the same as the ones above, but for the staff create endpoint
    BLOCKED = "BLOCKED", pgettext_lazy("ReservationTypeStaffChoice", "Blocked")
    STAFF = "STAFF", pgettext_lazy("ReservationTypeStaffChoice", "Staff")
    BEHALF = "BEHALF", pgettext_lazy("ReservationTypeStaffChoice", "Behalf")


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
