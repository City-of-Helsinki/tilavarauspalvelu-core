from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import ReservationNotification
from tilavarauspalvelu.integrations.email.find_language import get_application_email_language
from tilavarauspalvelu.models import Unit, User

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models import Application, Reservation
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "get_application_email_recipients",
    "get_recipients_for_applications_by_language",
    "get_reservation_email_recipients",
    "get_reservation_staff_notification_recipients",
]


def get_application_email_recipients(application: Application) -> list[str]:
    """Get email notification recipients for the given application."""
    recipients: set[str] = set()

    contact_person_email = getattr(application.contact_person, "email", None)
    applicant_email = getattr(application.user, "email", None)

    if contact_person_email:
        recipients.add(contact_person_email.lower())
    if applicant_email:
        recipients.add(applicant_email.lower())

    return list(recipients)


def get_reservation_email_recipients(reservation: Reservation) -> list[str]:
    """Get email notification recipients for the given reservation."""
    recipients: set[str] = set()

    reservation_user_email = getattr(reservation.user, "email", None)

    if reservation.reservee_email:
        recipients.add(reservation.reservee_email.lower())
    if reservation_user_email:
        recipients.add(reservation.user.email.lower())

    return list(recipients)


def get_recipients_for_applications_by_language(applications: Iterable[Application]) -> dict[Lang, set[str]]:
    """Get email notification recipients for multiple applications by the language the email should be sent in."""
    recipients_by_language: dict[Lang, set[str]] = defaultdict(set)

    for application in applications:
        user_language = get_application_email_language(application)
        recipients = get_application_email_recipients(application)
        if recipients:
            recipients_by_language[user_language].update(recipients)

    return recipients_by_language


def get_reservation_staff_notification_recipients(reservation: Reservation, *, handling: bool = False) -> list[str]:
    """
    Get staff users who should receive email notifications for the given reservation.

    :param reservation: The reservation the email concerns.
    :param handling: Does the email concern reservation handling?
    """
    notification_settings = [ReservationNotification.ALL]
    if handling:
        notification_settings.append(ReservationNotification.ONLY_HANDLING_REQUIRED)

    users = User.objects.filter(
        unit_roles__isnull=False,
        reservation_notification__in=notification_settings,
    ).exclude(email="")

    # Skip the reservation creator
    if reservation.user:
        users = users.exclude(pk=reservation.user.pk)

    units = (
        Unit.objects.filter(
            reservationunit__in=reservation.reservation_unit.all(),
        )
        .prefetch_related("unit_groups")
        .distinct()
    )

    # Only notify users who have the correct permissions for the given reservation's units.
    notification_recipients = (
        user.email  #
        for user in users
        if user.permissions.can_manage_reservations_for_units(units, any_unit=True)
    )

    # Remove possible duplicates
    return list(set(notification_recipients))
