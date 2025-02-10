from __future__ import annotations

import enum
from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any, Self

from django.db import models
from django.utils.translation import pgettext_lazy

from tilavarauspalvelu.integrations.email.rendering import render_html, render_text

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.typing import EmailAttachment, EmailContext

__all__ = [
    "EmailData",
    "EmailType",
]


@dataclass
class EmailData:
    recipients: Iterable[str]
    subject: str
    text_content: str
    html_content: str
    attachments: Iterable[EmailAttachment] = ()

    @classmethod
    def build(
        cls,
        recipients: Iterable[str],
        context: EmailContext,
        email_type: EmailType,
        attachment: EmailAttachment = None,
    ) -> Self:
        """Helper method to build an EmailData object with the given context and email type."""
        return cls(
            recipients=list(recipients),
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else [],
        )

    def __json__(self) -> dict[str, Any]:  # noqa: PLW3201
        """Make the object JSON serializable to be used in Celery tasks."""
        return asdict(self)


class EmailType(models.TextChoices):
    # Application
    APPLICATION_HANDLED = "application_handled", pgettext_lazy("EmailType", "Application handled")
    APPLICATION_IN_ALLOCATION = "application_in_allocation", pgettext_lazy("EmailType", "Application in allocation")
    APPLICATION_RECEIVED = "application_received", pgettext_lazy("EmailType", "Application received")

    APPLICATION_SECTION_CANCELLED = (
        "application_section_cancelled",
        pgettext_lazy("EmailType", "Application section cancelled"),
    )
    """User cancels all reservations in their application section"""

    # Permissions
    PERMISSION_DEACTIVATION = "permission_deactivation", pgettext_lazy("EmailType", "Permission deactivation")
    USER_ANONYMIZATION = "user_anonymization", pgettext_lazy("EmailType", "User anonymization")

    # Reservation
    RESERVATION_APPROVED = "reservation_approved", pgettext_lazy("EmailType", "Reservation approved")
    RESERVATION_CANCELLED = "reservation_cancelled", pgettext_lazy("EmailType", "Reservation cancelled")
    RESERVATION_CONFIRMED = "reservation_confirmed", pgettext_lazy("EmailType", "Reservation confirmed")
    RESERVATION_MODIFIED = "reservation_modified", pgettext_lazy("EmailType", "Reservation modified")
    RESERVATION_MODIFIED_ACCESS_CODE = (
        "reservation_modified_access_code",
        pgettext_lazy("EmailType", "Reservation modified access code"),
    )
    RESERVATION_REJECTED = "reservation_rejected", pgettext_lazy("EmailType", "Reservation rejected")
    RESERVATION_REQUIRES_HANDLING = (
        "reservation_requires_handling",
        pgettext_lazy("EmailType", "Reservation requires handling"),
    )
    RESERVATION_REQUIRES_PAYMENT = (
        "reservation_requires_payment",
        pgettext_lazy("EmailType", "Reservation requires payment"),
    )

    SEASONAL_RESERVATION_CANCELLED_SINGLE = (
        "seasonal_reservation_cancelled_single",
        pgettext_lazy("EmailType", "Seasonal reservation cancelled single"),
    )
    """User cancels one of their seasonal reservations"""

    SEASONAL_RESERVATION_MODIFIED_SERIES = (
        "seasonal_reservation_modified_series",
        pgettext_lazy("EmailType", "Seasonal reservation modified series"),
    )
    """Staff modifies a seasonal reservation series"""

    SEASONAL_RESERVATION_MODIFIED_SINGLE = (
        "seasonal_reservation_modified_single",
        pgettext_lazy("EmailType", "Seasonal reservation modified single"),
    )
    """Staff modifies a single seasonal reservation"""

    SEASONAL_RESERVATION_REJECTED_SERIES = (
        "seasonal_reservation_rejected_series",
        pgettext_lazy("EmailType", "Seasonal reservation rejected series"),
    )
    """Staff rejects a seasonal reservation series"""

    SEASONAL_RESERVATION_REJECTED_SINGLE = (
        "seasonal_reservation_rejected_single",
        pgettext_lazy("EmailType", "Seasonal reservation rejected single"),
    )
    """Staff rejects a single reservation in a seasonal reservation series"""

    # Staff
    STAFF_NOTIFICATION_APPLICATION_SECTION_CANCELLED = (
        "staff_notification_application_section_cancelled",
        pgettext_lazy("EmailType", "Staff notification application section cancelled"),
    )
    STAFF_NOTIFICATION_RESERVATION_MADE = (
        "staff_notification_reservation_made",
        pgettext_lazy("EmailType", "Staff notification reservation made"),
    )
    STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING = (
        "staff_notification_reservation_requires_handling",
        pgettext_lazy("EmailType", "Staff notification reservation requires handling"),
    )

    @enum.property
    def html_path(self) -> str:
        return f"email/html/{self.value}.jinja"

    @enum.property
    def text_path(self) -> str:
        return f"email/text/{self.value}.jinja"
