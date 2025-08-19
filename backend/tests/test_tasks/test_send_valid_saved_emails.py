from __future__ import annotations

import datetime
from unittest.mock import patch

import pytest

from tilavarauspalvelu.models import EmailMessage
from tilavarauspalvelu.tasks import send_valid_saved_emails_task
from utils.date_utils import local_datetime

from tests.factories import EmailMessageFactory


@pytest.mark.django_db
def test_send_valid_saved_emails(outbox, settings) -> None:
    settings.SEND_EMAILS = True

    email_message = EmailMessageFactory.create()

    send_valid_saved_emails_task()

    assert len(outbox) == 1

    assert outbox[0].subject == email_message.subject
    assert outbox[0].body == email_message.text_content
    assert outbox[0].bcc == email_message.recipients
    assert outbox[0].alternatives == [(email_message.html_content, "text/html")]

    assert EmailMessage.objects.count() == 0


@pytest.mark.django_db
def test_send_valid_saved_emails__delete_expired(outbox, settings) -> None:
    settings.SEND_EMAILS = True

    EmailMessageFactory.create(valid_until=local_datetime() - datetime.timedelta(days=1))

    send_valid_saved_emails_task()

    assert len(outbox) == 0

    assert EmailMessage.objects.count() == 0


@pytest.mark.django_db
def test_send_valid_saved_emails__sending_fails__copy_created(outbox, settings) -> None:
    settings.SEND_EMAILS = True

    email_message = EmailMessageFactory.create()

    with patch("django.core.mail.message.EmailMultiAlternatives.send", side_effect=TimeoutError):
        send_valid_saved_emails_task()

    assert len(outbox) == 0

    # Original message is deleted and a copy is created
    with pytest.raises(EmailMessage.DoesNotExist):
        email_message.refresh_from_db()

    messages = list(EmailMessage.objects.all())
    assert len(messages) == 1

    assert messages[0].subject == email_message.subject
    assert messages[0].text_content == email_message.text_content
    assert messages[0].html_content == email_message.html_content
    assert messages[0].recipients == email_message.recipients
    assert messages[0].valid_until == email_message.valid_until
    assert messages[0].created_at == email_message.created_at


@pytest.mark.django_db
def test_send_valid_saved_emails__partial_success__copy_created(outbox, settings) -> None:
    settings.SEND_EMAILS = True
    settings.EMAIL_MAX_RECIPIENTS = 1

    recipients = ["user1@example.com", "user2@example.com", "user3@example.com"]
    email_message = EmailMessageFactory.create(recipients=recipients)

    partial = False

    def send_partial(*args, **kwargs):
        nonlocal partial
        if partial:
            raise TimeoutError

        partial = True

    with patch("django.core.mail.message.EmailMultiAlternatives.send", side_effect=send_partial):
        send_valid_saved_emails_task()

    assert len(outbox) == 0

    # Original message is deleted and a copy is created
    with pytest.raises(EmailMessage.DoesNotExist):
        email_message.refresh_from_db()

    messages = list(EmailMessage.objects.all())
    assert len(messages) == 1

    assert messages[0].subject == email_message.subject
    assert messages[0].text_content == email_message.text_content
    assert messages[0].html_content == email_message.html_content
    assert messages[0].recipients == ["user2@example.com", "user3@example.com"]  # Recipients only ones that failed
    assert messages[0].valid_until == email_message.valid_until
    assert messages[0].created_at == email_message.created_at
