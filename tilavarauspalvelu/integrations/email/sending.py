from __future__ import annotations

from copy import copy
from itertools import batched
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from config.celery import app

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.typing import EmailAttachment, EmailData

__all__ = [
    "send_emails_in_batches_task",
]


@app.task(name="send_emails_in_batches")
def send_emails_in_batches_task(
    *,
    recipients: Iterable[str],
    subject: str,
    text_content: str,
    html_content: str,
    attachments: Iterable[EmailAttachment] = (),
) -> None:
    """
    Sends an email message to in batches.

    :param recipients: The recipients of the email.
    :param subject: The subject of the email.
    :param text_content: The text content of the email.
    :param html_content: The HTML content of the email.
    :param attachments: An attachments in the email.
    """
    if not settings.SEND_EMAILS:
        return

    email_message = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        alternatives=[(html_content, "text/html")],
    )
    for attachment in attachments:
        email_message.attach(**attachment)

    for batch in batched(recipients, settings.EMAIL_MAX_RECIPIENTS):
        email_message_copy = copy(email_message)
        email_message_copy.bcc = list(batch)
        email_message_copy.send(fail_silently=False)


@app.task(name="send_multiple_emails_in_baches")
def send_multiple_emails_in_batches_task(*, emails: list[EmailData]) -> None:
    for email_data in emails:
        send_emails_in_batches_task(
            recipients=email_data["recipients"],
            subject=email_data["subject"],
            text_content=email_data["text_content"],
            html_content=email_data["html_content"],
            attachments=email_data["attachments"],
        )
