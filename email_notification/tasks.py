from django.conf import settings

from applications.models import Application
from email_notification.helpers.email_sender import EmailNotificationSender
from email_notification.models import EmailType
from permissions.helpers import has_unit_permission
from reservations.models import Reservation
from spaces.models import Unit
from tilavarauspalvelu.celery import app
from users.models import ReservationNotification, User

###############
# Reservation #
###############


@app.task(name="send_reservation_email")
def send_reservation_email_task(reservation_id: int, email_type: EmailType) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    reservation = Reservation.objects.filter(id=reservation_id).first()
    if not reservation:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=None)
    email_notification_sender.send_reservation_email(reservation=reservation)


@app.task(name="send_staff_reservation_email")
def send_staff_reservation_email_task(
    reservation_id: int,
    email_type: EmailType,
    notification_settings: list[ReservationNotification],
) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    reservation = Reservation.objects.filter(id=reservation_id).first()
    if not reservation:
        return

    recipients = _get_reservation_staff_notification_recipients(reservation, notification_settings)
    if not recipients:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=recipients)
    email_notification_sender.send_reservation_email(reservation=reservation)


def _get_reservation_staff_notification_recipients(
    reservation: Reservation,
    notification_settings: list[ReservationNotification],
) -> list[str]:
    """
    Get staff users who should receive reservation notifications based on their unit roles and notification settings.

    Get users with unit roles and notifications enabled, collect the ones that can manage relevant units,
    have matching notification setting are not the reservation creator
    """
    notification_recipients: list[str] = []
    reservation_units = reservation.reservation_unit.all()
    units: list[int] = list(Unit.objects.filter(reservationunit__in=reservation_units).values_list("pk", flat=True))

    users = User.objects.filter(unit_roles__isnull=False).exclude(reservation_notification="NONE")
    for user in users:
        # Skip users who don't have the correct unit role
        if not has_unit_permission(user, "can_manage_reservations", units):
            continue

        # Skip users who don't have the correct notification setting
        if not (any(user.reservation_notification.upper() == setting.upper() for setting in notification_settings)):
            continue

        # Skip the reservation creator
        if reservation.user and reservation.user.pk == user.pk:
            continue

        notification_recipients.append(user.email)

    # Remove possible duplicates
    return list(set(notification_recipients))


###############
# Application #
###############


@app.task(name="send_application_email")
def send_application_email_task(application_id: int, email_type: EmailType) -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return
    application = Application.objects.filter(id=application_id).first()
    if not application:
        return

    email_notification_sender = EmailNotificationSender(email_type=email_type, recipients=None)
    email_notification_sender.send_application_email(application=application)
