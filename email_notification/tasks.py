from django.conf import settings
from lookup_property import L

from applications.enums import ApplicationRoundStatusChoice, ApplicationSectionStatusChoice
from applications.models import Application
from common.date_utils import local_datetime
from config.celery import app
from email_notification.exceptions import SendEmailNotificationError
from email_notification.helpers.email_sender import EmailNotificationSender
from email_notification.models import EmailType
from reservations.models import Reservation
from spaces.models import Unit
from tilavarauspalvelu.enums import ReservationNotification
from utils.sentry import SentryLogger

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
    email_notification_sender.send_reservation_email(reservation=reservation, forced_language=settings.LANGUAGE_CODE)


def _get_reservation_staff_notification_recipients(
    reservation: Reservation,
    notification_settings: list[ReservationNotification],
) -> list[str]:
    """
    Get staff users who should receive reservation notifications based on their unit roles and notification settings.

    Get users with unit roles and notifications enabled, collect the ones that can manage relevant units,
    have matching notification setting are not the reservation creator
    """
    from tilavarauspalvelu.models import User

    notification_recipients: list[str] = []
    reservation_units = reservation.reservation_unit.all()
    units = Unit.objects.filter(reservationunit__in=reservation_units).prefetch_related("unit_groups").distinct()
    users = User.objects.filter(unit_roles__isnull=False).exclude(reservation_notification="NONE")
    for user in users:
        # Skip users who don't have the correct unit role
        if not user.permissions.can_manage_reservations_for_units(units, any_unit=True):
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


@app.task(name="send_application_in_allocation_emails")
def send_application_in_allocation_email_task() -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return

    # Don't try to send anything if the email template is not defined (EmailNotificationSender will raise an error)
    try:
        email_sender = EmailNotificationSender(email_type=EmailType.APPLICATION_IN_ALLOCATION, recipients=None)
    except SendEmailNotificationError:
        msg = "Tried to send an email, but Email Template for APPLICATION_IN_ALLOCATION was not found."
        SentryLogger.log_message(msg, level="warning")
        return

    # Get all applications that need a notification to be sent
    applications = Application.objects.filter(
        L(application_round__status=ApplicationRoundStatusChoice.IN_ALLOCATION.value),
        L(status=ApplicationSectionStatusChoice.IN_ALLOCATION.value),
        in_allocation_notification_sent_date__isnull=True,
        application_sections__isnull=False,
    ).order_by("created_date")
    if not applications:
        return

    email_sender.send_batch_application_emails(applications=applications)
    applications.update(in_allocation_notification_sent_date=local_datetime())


@app.task(name="send_application_handled_emails")
def send_application_handled_email_task() -> None:
    if not settings.SEND_RESERVATION_NOTIFICATION_EMAILS:
        return

    # Don't try to send anything if the email template is not defined (EmailNotificationSender will raise an error)
    try:
        email_sender = EmailNotificationSender(email_type=EmailType.APPLICATION_HANDLED, recipients=None)
    except SendEmailNotificationError:
        msg = "Tried to send an email, but Email Template for APPLICATION_HANDLED was not found."
        SentryLogger.log_message(msg, level="warning")
        return

    # Get all applications that need a notification to be sent
    applications = Application.objects.filter(
        L(application_round__status=ApplicationRoundStatusChoice.HANDLED.value),
        L(status=ApplicationSectionStatusChoice.HANDLED.value),
        results_ready_notification_sent_date__isnull=True,
        application_sections__isnull=False,
    ).order_by("created_date")
    if not applications:
        return

    email_sender.send_batch_application_emails(applications=applications)
    applications.update(results_ready_notification_sent_date=local_datetime())
