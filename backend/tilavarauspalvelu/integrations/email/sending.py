from __future__ import annotations

from copy import copy
from itertools import batched
from smtplib import SMTPException
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from config.celery import app
from tilavarauspalvelu.integrations.email.typing import EmailData
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import EmailMessage

if TYPE_CHECKING:
    from collections.abc import Iterable


__all__ = [
    "send_emails_in_batches_task",
    "send_multiple_emails_in_batches_task",
]


@app.task(name="send_emails_in_batches")
def send_emails_in_batches_task(email_data: EmailData) -> None:
    """Sends an email message in batches."""
    if not settings.SEND_EMAILS:
        return

    # Celery converts EmailData to a dict so it's serializable. If the method is called directly, convert it here.
    if isinstance(email_data, dict):
        email_data = EmailData(**email_data)

    email_message = EmailMultiAlternatives(
        subject=email_data.subject,
        body=email_data.text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        alternatives=[(email_data.html_content, "text/html")],
    )
    for attachment in email_data.attachments:
        email_message.attach(**attachment)

    db_email_message: EmailMessage | None = None

    for batch in batched(email_data.recipients, settings.EMAIL_MAX_RECIPIENTS, strict=False):
        if db_email_message is not None:
            db_email_message.recipients.extend(batch)
            continue

        email_message_copy = copy(email_message)
        email_message_copy.bcc = list(batch)

        try:
            email_message_copy.send(fail_silently=False)

        except Exception as error:  # noqa: BLE001
            #
            # 'builtins.TimeoutError' is raised if the connection to the SMTP server times out.
            # 'smtplib.SMTPException' is raised if the SMTP server returns an error.
            # Any other exception is logged to Sentry so we can investigate the issue.
            if not isinstance(error, (TimeoutError, SMTPException)):
                SentryLogger.log_exception(error, details="Failed to send email message")

            db_email_message = EmailMessage(
                recipients=list(batch),
                subject=email_data.subject,
                text_content=email_data.text_content,
                html_content=email_data.html_content,
                attachments=email_data.attachments,
                valid_until=email_data.valid_until,
                created_at=email_data.created_at,
            )

    if db_email_message is not None:
        db_email_message.save()


@app.task(name="send_multiple_emails_in_batches")
def send_multiple_emails_in_batches_task(*, emails: Iterable[EmailData]) -> None:
    for email_data in emails:
        send_emails_in_batches_task(email_data)
