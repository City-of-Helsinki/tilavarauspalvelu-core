from typing import List, Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from sentry_sdk import capture_message

from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    ReservationEmailNotificationBuilder,
)
from reservations.models import Reservation


def send_reservation_email_notification(
    email_type: EmailType,
    reservation: Reservation,
    recipients: Optional[List[str]] = None,
):
    if recipients is not None and len(recipients) > settings.EMAIL_MAX_RECIPIENTS:
        raise Exception(
            f"Refusing to notify more than {settings.EMAIL_MAX_RECIPIENTS} users. Email type: %s. Reservation: %s"
            % (email_type, reservation.pk)
        )

    mail_template = EmailTemplate.objects.filter(type=email_type).first()
    if not mail_template:
        capture_message(
            f"Tried to send '{email_type}' notification but no template was defined",
            level="error",
        )
    message_builder = ReservationEmailNotificationBuilder(
        reservation, mail_template, language=reservation.reservee_language
    )
    subject = message_builder.get_subject()
    message = message_builder.get_content()

    if recipients is None:
        recipients = [reservation.reservee_email]

    email = EmailMultiAlternatives(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        bcc=recipients,
    )
    email.send(fail_silently=False)
