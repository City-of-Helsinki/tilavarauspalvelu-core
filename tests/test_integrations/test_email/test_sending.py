from __future__ import annotations

from django.test import override_settings

from tilavarauspalvelu.integrations.email.dataclasses import EmailData
from tilavarauspalvelu.integrations.email.sending import (
    send_emails_in_batches_task,
    send_multiple_emails_in_batches_task,
)
from tilavarauspalvelu.typing import EmailAttachment


@override_settings(SEND_EMAILS=True)
def test_send_emails_in_batches_task(outbox):
    send_emails_in_batches_task(
        EmailData(
            recipients=["user@example.com"],
            subject="subject",
            text_content="content",
            html_content="<html>content</html>",
        )
    )

    assert len(outbox) == 1

    assert outbox[0].subject == "subject"
    assert outbox[0].body == "content"
    assert outbox[0].bcc == ["user@example.com"]
    assert outbox[0].alternatives == [("<html>content</html>", "text/html")]


@override_settings(SEND_EMAILS=False)
def test_send_emails_in_batches_task__sent_emails_off(outbox):
    send_emails_in_batches_task(
        EmailData(
            recipients=["user@example.com"],
            subject="subject",
            text_content="content",
            html_content="<html>content</html>",
        )
    )

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True, EMAIL_MAX_RECIPIENTS=2)
def test_send_emails_in_batches_task__multiple_batches(outbox):
    send_emails_in_batches_task(
        EmailData(
            recipients=["user1@example.com", "user2@example.com", "user3@example.com"],
            subject="subject",
            text_content="content",
            html_content="<html>content</html>",
        )
    )

    assert len(outbox) == 2

    assert outbox[0].subject == "subject"
    assert outbox[0].body == "content"
    assert outbox[0].bcc == ["user1@example.com", "user2@example.com"]
    assert outbox[0].alternatives == [("<html>content</html>", "text/html")]

    assert outbox[1].subject == "subject"
    assert outbox[1].body == "content"
    assert outbox[1].bcc == ["user3@example.com"]
    assert outbox[1].alternatives == [("<html>content</html>", "text/html")]


@override_settings(SEND_EMAILS=True)
def test_send_emails_in_batches_task__attachments(outbox):
    send_emails_in_batches_task(
        EmailData(
            recipients=["user@example.com"],
            subject="subject",
            text_content="content",
            html_content="<html>content</html>",
            attachments=[EmailAttachment(filename="file.txt", content="content", mimetype="text/plain")],
        )
    )

    assert len(outbox) == 1

    assert outbox[0].attachments == [("file.txt", "content", "text/plain")]


@override_settings(SEND_EMAILS=True)
def test_send_multiple_emails_in_batches_task(outbox):
    emails = [
        EmailData(
            recipients=["user1@example.com"],
            subject="subject 1",
            text_content="content 1",
            html_content="<html>content 1</html>",
            attachments=[],
        ),
        EmailData(
            recipients=["user2@example.com"],
            subject="subject 2",
            text_content="content 2",
            html_content="<html>content 2</html>",
            attachments=[],
        ),
    ]

    send_multiple_emails_in_batches_task(emails=emails)

    assert len(outbox) == 2

    assert outbox[0].subject == "subject 1"
    assert outbox[0].body == "content 1"
    assert outbox[0].bcc == ["user1@example.com"]
    assert outbox[0].alternatives == [("<html>content 1</html>", "text/html")]

    assert outbox[1].subject == "subject 2"
    assert outbox[1].body == "content 2"
    assert outbox[1].bcc == ["user2@example.com"]
    assert outbox[1].alternatives == [("<html>content 2</html>", "text/html")]
