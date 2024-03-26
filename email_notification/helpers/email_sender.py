from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from applications.models import Application
from email_notification.exceptions import SendEmailNotificationError
from email_notification.helpers.email_builder_application import ApplicationEmailBuilder
from email_notification.helpers.email_builder_base import BaseEmailBuilder
from email_notification.helpers.email_builder_reservation import ReservationEmailBuilder
from email_notification.models import EmailTemplate, EmailType
from reservations.models import Reservation
from tilavarauspalvelu.utils.commons import LanguageType

if TYPE_CHECKING:
    from email_notification.admin.email_tester import EmailTemplateTesterForm


class EmailNotificationSender:
    """
    Helper class for sending email notifications.

    This class is handles the sending of email notifications and can determine the recipients of the email.
    """

    email_template: EmailTemplate
    recipients: list[str] | None

    def __init__(self, *, email_type: EmailType, recipients: list[str] | None = None):
        self.email_template = EmailTemplate.objects.filter(type=email_type).first()

        # Manually defined recipients, if the notification should be sent to a specific list of email addresses.
        # If None, the recipients are determined based on the reservation or application.
        self.recipients = recipients

        # Validate recipients count
        if self.recipients and len(self.recipients) > settings.EMAIL_MAX_RECIPIENTS:
            raise SendEmailNotificationError(
                f"Refusing to notify more than '{settings.EMAIL_MAX_RECIPIENTS}' users. "
                f"Email type: '{self.email_template.type}'"
            )

        if not self.email_template:
            msg = f"Unable to send '{email_type}' notification, there is no EmailTemplate defined for it."
            raise SendEmailNotificationError(msg)

    def send_reservation_email(self, *, reservation: Reservation):
        if self.recipients is None:
            # Get recipients from the reservation
            self.recipients = []
            if reservation.reservee_email:
                self.recipients.append(reservation.reservee_email)
            if reservation.user and reservation.user.email:
                self.recipients.append(reservation.user.email)
            self.recipients = list(set(self.recipients))  # Remove possible duplicates

        message_builder = ReservationEmailBuilder.from_reservation(
            template=self.email_template,
            reservation=reservation,
        )

        self._send_email(message_builder)

    def send_test_reservation_email(self, *, form: EmailTemplateTesterForm):
        self.recipients = [form.cleaned_data["recipient"]]

        language: LanguageType
        for language in ["fi", "sv", "en"]:
            message_builder = ReservationEmailBuilder.from_form(
                template=self.email_template,
                form=form,
                language=language,
            )
            self._send_email(message_builder)

    def send_application_email(self, *, application: Application):
        # Get recipients from the application
        if self.recipients is None:
            self.recipients = []
            if application.contact_person and application.contact_person.email:
                self.recipients.append(application.contact_person.email)
            if application.user and application.user.email:
                self.recipients.append(application.user.email)
            self.recipients = list(set(self.recipients))  # Remove possible duplicates

        message_builder = ApplicationEmailBuilder.from_application(
            template=self.email_template,
            application=application,
        )

        self._send_email(message_builder)

    def send_test_application_email(self, *, form: EmailTemplateTesterForm):
        self.recipients = [form.cleaned_data["recipient"]]

        language: LanguageType
        for language in ["fi", "sv", "en"]:
            message_builder = ApplicationEmailBuilder.from_form(
                template=self.email_template,
                form=form,
                language=language,
            )
            self._send_email(message_builder)

    def _send_email(self, message_builder: BaseEmailBuilder) -> None:
        subject = message_builder.get_subject()
        text_content = message_builder.get_content()
        html_content = message_builder.get_html_content()

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            bcc=self.recipients,
        )

        if html_content:
            email_message.attach_alternative(html_content, "text/html")

        email_message.send(fail_silently=False)
