import pytest

from applications.models import Application
from email_notification.helpers.email_sender import EmailNotificationSender
from email_notification.models import EmailType
from tests.factories import ApplicationFactory, EmailTemplateFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_email_sender__application__success__correct_email_recipient_addresses(outbox):
    email_template = EmailTemplateFactory.create(type=EmailType.APPLICATION_RECEIVED)
    application: Application = ApplicationFactory.create()

    email_notification_sender = EmailNotificationSender(
        email_type=email_template.type,
        recipients=None,
    )
    email_notification_sender.send_application_email(application=application)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert set(outbox[0].bcc) == {application.user.email, application.contact_person.email}
