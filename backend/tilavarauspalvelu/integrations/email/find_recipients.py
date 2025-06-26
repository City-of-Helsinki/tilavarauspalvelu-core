from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import ReservationNotification
from tilavarauspalvelu.integrations.email.find_language import get_application_email_language
from tilavarauspalvelu.models import Unit, User

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models import Application, ApplicationSection, Reservation, ReservationSeries
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "get_application_email_recipients",
    "get_recipients_for_applications_by_language",
    "get_reservation_email_recipients",
    "get_reservation_staff_notification_recipients_by_language",
    "get_series_email_recipients",
]


def get_application_email_recipients(application: Application) -> list[str]:
    """Get email notification recipients for the given application."""
    recipients: set[str] = set()

    if application.contact_person_email:
        recipients.add(application.contact_person_email.lower())

    if application.user.email:
        recipients.add(application.user.email.lower())

    return list(recipients)


def get_series_email_recipients(series: ReservationSeries) -> list[str]:
    """Get email notification recipients for the given series."""
    recipients: set[str] = set()

    if series.user.email:
        recipients.add(series.user.email.lower())

    if series.allocated_time_slot is not None:
        application = series.allocated_time_slot.reservation_unit_option.application_section.application
        recipients.update(get_application_email_recipients(application))

    return list(recipients)


def get_reservation_email_recipients(reservation: Reservation) -> list[str]:
    """Get email notification recipients for the given reservation."""
    recipients: set[str] = set()

    if reservation.reservee_email:
        recipients.add(reservation.reservee_email.lower())

    if reservation.user.email:
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


def get_users_by_email_language(users: Iterable[User]) -> dict[Lang, set[str]]:
    recipients_by_language: dict[Lang, set[str]] = defaultdict(set)
    for user in users:
        if user.email:
            user_language = user.get_preferred_language()
            recipients_by_language[user_language].add(user.email.lower())

    return recipients_by_language


def get_reservation_staff_notification_recipients_by_language(
    reservation: Reservation,
    *,
    handling: bool = False,
) -> dict[Lang, set[str]]:
    """
    Get staff users who should receive email notifications for the given reservation.
    Group recipients by their preferred language.

    :param reservation: The reservation the email concerns.
    :param handling: Does the email concern reservation handling?
    """
    recipients_by_language: dict[Lang, set[str]] = defaultdict(set)

    notification_settings = [ReservationNotification.ALL]
    if handling:
        notification_settings.append(ReservationNotification.ONLY_HANDLING_REQUIRED)

    # Only fetch users with active unit roles and appropriate notification settings.
    users = User.objects.filter(
        unit_roles__isnull=False,
        unit_roles__is_role_active=True,
        reservation_notification__in=notification_settings,
    ).exclude(email="")

    # Skip the reservation creator
    users = users.exclude(pk=reservation.user.pk)

    units = (
        Unit.objects.filter(reservation_units__in=[reservation.reservation_unit])
        .prefetch_related("unit_groups")
        .distinct()
    )

    # Only notify users who have the correct active permissions for the given reservation's units.
    for user in users:
        if user.permissions.can_manage_reservations_for_units(units, any_unit=True):
            user_language = user.get_preferred_language()
            recipients_by_language[user_language].add(user.email.lower())

    return recipients_by_language


def get_application_section_staff_notification_recipients_by_language(
    application_section: ApplicationSection,
) -> dict[Lang, set[str]]:
    """
    Get staff users who should receive email notifications for the given application.
    Group recipients by their preferred language.
    """
    recipients_by_language: dict[Lang, set[str]] = defaultdict(set)

    notification_settings = [ReservationNotification.ONLY_HANDLING_REQUIRED, ReservationNotification.ALL]

    # Only fetch users with active unit roles and appropriate notification settings.
    users = User.objects.filter(
        unit_roles__isnull=False,
        unit_roles__is_role_active=True,
        reservation_notification__in=notification_settings,
    ).exclude(email="")

    # Skip the application creator
    users = users.exclude(pk=application_section.application.user.pk)

    units = (
        Unit.objects.prefetch_related("unit_groups")
        .filter(
            # The ReservationUnits must be fetched through AllocatedTimeSlot, since ReservationUnitOptions may contain
            # ReservationUnits which has not been allocated any slots in application handling
            reservation_units__reservation_series__allocated_time_slot__reservation_unit_option__application_section=application_section
        )
        .distinct()
    )

    # Only notify users who have the correct active permissions for the given reservation's units.
    for user in users:
        if user.permissions.can_manage_reservations_for_units(units, any_unit=True):
            user_language = user.get_preferred_language()
            recipients_by_language[user_language].add(user.email.lower())

    return recipients_by_language
