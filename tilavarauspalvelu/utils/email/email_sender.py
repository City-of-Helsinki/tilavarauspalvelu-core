from __future__ import annotations

from copy import copy
from itertools import batched
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from tilavarauspalvelu.exceptions import SendEmailNotificationError
from tilavarauspalvelu.models import EmailTemplate
from tilavarauspalvelu.utils.email.email_builder_application import ApplicationEmailBuilder
from tilavarauspalvelu.utils.email.email_builder_reservation import ReservationEmailBuilder
from utils.utils import safe_getattr

if TYPE_CHECKING:
    from collections.abc import Iterable

    from config.utils.commons import LanguageType
    from tilavarauspalvelu.admin.email_template.tester import EmailTemplateTesterForm
    from tilavarauspalvelu.enums import EmailType
    from tilavarauspalvelu.models import Application, Reservation
    from tilavarauspalvelu.utils.email.email_builder_base import BaseEmailBuilder


class EmailNotificationSender:
    """
    Helper class for sending email notifications.

    This class is handles the sending of email notifications and can determine the recipients of the email.
    """

    email_template: EmailTemplate
    recipients: list[str] | None

    def __init__(self, *, email_type: EmailType, recipients: list[str] | None = None) -> None:
        self.email_template = EmailTemplate.objects.filter(type=email_type).first()

        # Manually defined recipients, if the notification should be sent to a specific list of email addresses.
        # If None, the recipients are determined based on the reservation or application.
        self.recipients = recipients

        if not self.email_template:
            msg = f"Unable to send '{email_type}' notification, there is no EmailTemplate defined for it."
            raise SendEmailNotificationError(msg)

    def send_reservation_email(self, *, reservation: Reservation, forced_language: LanguageType | None = None) -> None:
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
            forced_language=forced_language,
        )

        self._send_email(message_builder)

    def send_test_reservation_email(self, *, form: EmailTemplateTesterForm) -> None:
        self.recipients = [form.cleaned_data["recipient"]]

        language: LanguageType
        for language in ["fi", "sv", "en"]:
            message_builder = ReservationEmailBuilder.from_form(
                template=self.email_template,
                form=form,
                language=language,
            )
            self._send_email(message_builder)

    def send_application_email(self, *, application: Application, forced_language: LanguageType | None = None) -> None:
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
            forced_language=forced_language,
        )

        self._send_email(message_builder)

    def send_batch_application_emails(self, *, applications: Iterable[Application]) -> None:
        # Sort recipients by language, so that we can batch send the emails in the correct language
        # and avoid sending the same email to the same recipient multiple times.
        all_recipients: set[str] = set()
        recipients_by_language: dict[LanguageType, set[str]] = {"fi": set(), "sv": set(), "en": set()}
        for application in applications:
            user_language = safe_getattr(application.user, "preferred_language") or settings.LANGUAGE_CODE
            if email := safe_getattr(application.contact_person, "email"):
                if email in all_recipients:
                    continue
                all_recipients.add(email)
                recipients_by_language[user_language].add(email)
            if email := safe_getattr(application.user, "email"):
                if email in all_recipients:
                    continue
                all_recipients.add(email)
                recipients_by_language[user_language].add(email)

        for language, recipients in recipients_by_language.items():
            if not recipients:
                continue
            self.recipients = list(recipients)
            message_builder = ApplicationEmailBuilder.build(template=self.email_template, language=language)
            self._send_email(message_builder)

    def send_test_application_email(self, *, form: EmailTemplateTesterForm) -> None:
        self.recipients = [form.cleaned_data["recipient"]]

        language: LanguageType
        for language in ["fi", "sv", "en"]:
            message_builder = ApplicationEmailBuilder.build(
                template=self.email_template,
                language=language,
            )
            self._send_email(message_builder)

    def _send_email(self, message_builder: BaseEmailBuilder) -> None:
        if not self.recipients:
            raise SendEmailNotificationError("No recipients defined for the email notification.")

        subject = message_builder.get_subject()
        text_content = message_builder.get_content()
        html_content = message_builder.get_html_content()
        attachment = message_builder.get_attachment()

        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            bcc=self.recipients,
            alternatives=[(html_content, "text/html")],
        )
        if attachment is not None:
            email_message.attach(**attachment)

        # Send emails in batches (if there are more recipients than the maximum allowed)
        for batch in batched(self.recipients, settings.EMAIL_MAX_RECIPIENTS):
            email_message_copy = copy(email_message)  # Copy the email message to avoid modifying the original
            email_message_copy.bcc = list(batch)
            email_message_copy.send(fail_silently=False)
