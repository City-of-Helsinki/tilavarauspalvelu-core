import pytest
from django.test import override_settings

from applications.models import Application
from common.date_utils import local_datetime
from email_notification.helpers.email_sender import EmailNotificationSender
from email_notification.models import EmailType
from email_notification.tasks import send_application_handled_email_task, send_application_in_allocation_email_task
from tests.factories import ApplicationFactory, EmailTemplateFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

########################
# APPLICATION_RECEIVED #
########################


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


#############################
# APPLICATION_IN_ALLOCATION #
#############################


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__in_allocation__success__single_application(outbox):
    email_template = EmailTemplateFactory.create(type=EmailType.APPLICATION_IN_ALLOCATION)
    application: Application = ApplicationFactory.create_in_status_in_allocation()
    # Applications that should not be sent emails for
    ApplicationFactory.create_in_status_draft()
    ApplicationFactory.create_in_status_received()
    ApplicationFactory.create_in_status_in_allocation(in_allocation_notification_sent_date=local_datetime())
    ApplicationFactory.create_in_status_in_allocation_no_sections()
    ApplicationFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_result_sent()

    send_application_in_allocation_email_task()

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert set(outbox[0].bcc) == {application.user.email, application.contact_person.email}

    assert Application.objects.first().in_allocation_notification_sent_date is not None


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__in_allocation__success__multiple_round_and_applications_and_languages(outbox):
    email_template = EmailTemplateFactory.create(
        type=EmailType.APPLICATION_IN_ALLOCATION,
        subject_fi="subject_fi",
        content_fi="content_fi",
        subject_sv="subject_sv",
        content_sv="content_sv",
    )
    application_1: Application = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="fi",
        user__email="foo@bar.fi",  # Only included once, in the first language it appears in
    )
    application_2: Application = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="fi",
        user__email="foo@bar.fi",
    )
    application_3: Application = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_2.application_round,
        user__preferred_language="sv",
        user__email="foo@bar.fi",
        contact_person__email="foo@bar.sv",
    )

    send_application_in_allocation_email_task()

    assert len(outbox) == 2
    assert outbox[0].subject == email_template.subject_fi
    assert outbox[0].body == email_template.content_fi
    assert set(outbox[0].bcc) == {
        application_1.user.email,
        application_1.contact_person.email,
        application_2.contact_person.email,
    }

    assert outbox[1].subject == email_template.subject_sv
    assert outbox[1].body == email_template.content_sv
    assert set(outbox[1].bcc) == {application_3.contact_person.email}

    assert Application.objects.filter(in_allocation_notification_sent_date__isnull=True).exists() is False


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__in_allocation__nothing_sent__template_missing(outbox):
    ApplicationFactory.create_in_status_in_allocation()
    send_application_in_allocation_email_task()
    assert len(outbox) == 0


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__in_allocation__nothing_sent__applications_missing(outbox):
    EmailTemplateFactory.create(type=EmailType.APPLICATION_IN_ALLOCATION)
    send_application_in_allocation_email_task()
    assert len(outbox) == 0


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=False)
def test_email_sender__application__in_allocation__nothing_sent__setting_disabled(outbox):
    EmailTemplateFactory.create(type=EmailType.APPLICATION_IN_ALLOCATION)
    ApplicationFactory.create_in_status_in_allocation()
    send_application_in_allocation_email_task()
    assert len(outbox) == 0


#######################
# APPLICATION_HANDLED #
#######################


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__handled__success__single_application(outbox):
    email_template = EmailTemplateFactory.create(type=EmailType.APPLICATION_HANDLED)
    application: Application = ApplicationFactory.create_in_status_handled()
    # Applications that should not be sent emails for
    ApplicationFactory.create_in_status_draft()
    ApplicationFactory.create_in_status_received()
    ApplicationFactory.create_in_status_in_allocation()
    ApplicationFactory.create_in_status_handled(results_ready_notification_sent_date=local_datetime())
    ApplicationFactory.create_in_status_handled_no_sections()
    ApplicationFactory.create_in_status_result_sent()

    send_application_handled_email_task()

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert set(outbox[0].bcc) == {application.user.email, application.contact_person.email}

    assert Application.objects.first().results_ready_notification_sent_date is not None


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__handled__success__multiple_round_and_applications_and_languages(outbox):
    email_template = EmailTemplateFactory.create(
        type=EmailType.APPLICATION_HANDLED,
        subject_fi="subject_fi",
        content_fi="content_fi",
        subject_sv="subject_sv",
        content_sv="content_sv",
    )
    application_1: Application = ApplicationFactory.create_in_status_handled(
        user__preferred_language="fi",
        user__email="foo@bar.fi",  # Only included once, in the first language it appears in
    )
    application_2: Application = ApplicationFactory.create_in_status_handled(
        user__preferred_language="fi",
        user__email="foo@bar.fi",
    )
    application_3: Application = ApplicationFactory.create_in_status_handled(
        application_round=application_2.application_round,
        user__preferred_language="sv",
        user__email="foo@bar.fi",
        contact_person__email="foo@bar.sv",
    )

    send_application_handled_email_task()

    assert len(outbox) == 2
    assert outbox[0].subject == email_template.subject_fi
    assert outbox[0].body == email_template.content_fi
    assert set(outbox[0].bcc) == {
        application_1.user.email,
        application_1.contact_person.email,
        application_2.contact_person.email,
    }

    assert outbox[1].subject == email_template.subject_sv
    assert outbox[1].body == email_template.content_sv
    assert set(outbox[1].bcc) == {application_3.contact_person.email}

    assert Application.objects.filter(results_ready_notification_sent_date__isnull=True).exists() is False


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__handled__nothing_sent__template_missing(outbox):
    ApplicationFactory.create_in_status_handled()
    send_application_handled_email_task()
    assert len(outbox) == 0


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__application__handled__nothing_sent__applications_missing(outbox):
    EmailTemplateFactory.create(type=EmailType.APPLICATION_HANDLED)
    send_application_handled_email_task()
    assert len(outbox) == 0


@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=False)
def test_email_sender__application__handled__nothing_sent__setting_disabled(outbox):
    EmailTemplateFactory.create(type=EmailType.APPLICATION_HANDLED)
    ApplicationFactory.create_in_status_handled()
    send_application_handled_email_task()
    assert len(outbox) == 0
