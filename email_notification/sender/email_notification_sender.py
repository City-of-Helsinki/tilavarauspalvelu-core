from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from email_notification.admin.email_tester import EmailTemplateTesterForm
from email_notification.exceptions import SendEmailNotificationError
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    ReservationEmailNotificationBuilder,
)
from reservations.models import Reservation


class EmailNotificationSender:
    recipients: list[str] | None
    email_template: EmailTemplate

    def __init__(self, email_type: EmailType, recipients: list[str] | None = None):
        self.recipients = recipients
        self.email_template = EmailTemplate.objects.filter(type=email_type).first()

        if not self.email_template:
            raise SendEmailNotificationError(
                f"Unable to send '{email_type}' notification, there is no EmailTemplate defined for it."
            )

    def _validate_recipients_count(self, reservation: Reservation | None, context: EmailNotificationContext | None):
        reservation_id = reservation.pk if reservation else context.reservation_number

        if self.recipients is not None and len(self.recipients) > settings.EMAIL_MAX_RECIPIENTS:
            raise SendEmailNotificationError(
                f"Refusing to notify more than '{settings.EMAIL_MAX_RECIPIENTS}' users. "
                f"Email type: '{self.email_template.type}' "
                f"Reservation: '{reservation_id}'"
            )

    def send_reservation_email_notification(
        self,
        *,
        reservation: Reservation | None = None,
        context: EmailNotificationContext | None = None,
    ):
        if not reservation and not context:
            raise SendEmailNotificationError("Reservation or context must be provided.")

        self._validate_recipients_count(reservation, context)

        if not self.recipients:
            self.recipients: set[str] = set()
            if reservation.reservee_email:
                self.recipients.add(reservation.reservee_email)
            if reservation.user and reservation.user.email:
                self.recipients.add(reservation.user.email)

        language: str = reservation.reservee_language if reservation else context.reservee_language

        message_builder = ReservationEmailNotificationBuilder(
            reservation=reservation,
            template=self.email_template,
            language=language,
            context=context,
        )
        self._send_email(message_builder)

    def send_test_emails(self, *, form: EmailTemplateTesterForm):
        context = EmailNotificationContext.from_form(form)
        for language in ["fi", "sv", "en"]:
            context.reservee_language = language

            self.recipients = [form.cleaned_data["recipient"]]
            self.send_reservation_email_notification(context=context)

    def _send_email(self, message_builder: ReservationEmailNotificationBuilder) -> None:
        subject = message_builder.get_subject()
        text_content = message_builder.get_content()
        html_content = message_builder.get_html_content()

        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            bcc=self.recipients,
        )

        if html_content:
            email.attach_alternative(html_content, "text/html")

        email.send(fail_silently=False)
