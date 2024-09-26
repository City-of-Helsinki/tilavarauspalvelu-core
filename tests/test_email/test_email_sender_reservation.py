import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings

from email_notification.admin.email_template_tester import EmailTemplateTesterForm
from email_notification.helpers.email_sender import EmailNotificationSender
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from email_notification.models import EmailTemplate, EmailType
from tests.factories import EmailTemplateFactory, ReservationFactory, UserFactory
from tilavarauspalvelu.enums import ReservationNotification

if TYPE_CHECKING:
    from reservations.models import Reservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def email_template() -> EmailTemplate:
    return EmailTemplateFactory.create(
        type=EmailType.RESERVATION_CONFIRMED,
        subject="foo",
        content="bar",
        subject_fi="fi",
        content_fi="fi",
        subject_en="en",
        content_en="en",
        subject_sv="sv",
        content_sv="sv",
    )


def test_email_sender__reservation__success__reservee_email(outbox, email_template):
    """Test that the email is sent to the reservee email address."""
    reservation: Reservation = ReservationFactory.create(
        reservee_email="example@email.com",
        user=None,
        reservation_unit__unit__name="foo",
    )

    email_notification_sender = EmailNotificationSender(
        email_type=email_template.type,
        recipients=None,
    )
    email_notification_sender.send_reservation_email(reservation=reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == [reservation.reservee_email]


def test_email_sender__reservation__success__reservation_user_email(outbox, email_template):
    """Test that the email is sent to the reservation user email address."""
    reservation: Reservation = ReservationFactory.create(
        user__email="example@email.com",
        reservation_unit__unit__name="foo",
    )

    email_notification_sender = EmailNotificationSender(
        email_type=email_template.type,
        recipients=None,
    )
    email_notification_sender.send_reservation_email(reservation=reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == [reservation.user.email]


def test_email_sender__reservation__success__reservee_and_user_email(outbox, email_template):
    """Test that the email is sent to both the reservee and the reservation user email addresses."""
    reservation: Reservation = ReservationFactory.create(
        reservee_email="example1@email.com",
        user__email="example2@email.com",
        reservation_unit__unit__name="foo",
    )

    email_notification_sender = EmailNotificationSender(
        email_type=email_template.type,
        recipients=None,
    )
    email_notification_sender.send_reservation_email(reservation=reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert sorted(outbox[0].bcc) == [reservation.reservee_email, reservation.user.email]


def test_email_sender__reservation__with_multiple_recipients__success(outbox, email_template):
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo")

    recipients = [
        "liu.kang@earthrealm.com",
        "sonya.blade@earthrealm.com",
        "shao.kahn@outworld.com",
        "mileena@outworld.com",
    ]
    email_notification_sender = EmailNotificationSender(
        email_type=email_template.type,
        recipients=recipients,
    )
    email_notification_sender.send_reservation_email(reservation=reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == recipients


@override_settings(EMAIL_MAX_RECIPIENTS=3)
def test_email_sender__reservation__with_multiple_recipients__too_many_recipients(outbox, email_template):
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo")

    recipients = [
        "liu.kang@earthrealm.com",
        "sonya.blade@earthrealm.com",
        "shao.kahn@outworld.com",
        "mileena@outworld.com",
    ]

    email_notification_sender = EmailNotificationSender(email_type=email_template.type, recipients=recipients)
    email_notification_sender.send_reservation_email(reservation=reservation)

    # Emails are sent in batches
    assert len(outbox) == 2
    assert len(outbox[0].bcc) == 3
    assert len(outbox[1].bcc) == 1


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_sender__reservation__reservation_language_is_used(outbox, language, email_template):
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo", reservee_language=language)

    email_notification_sender = EmailNotificationSender(email_type=email_template.type, recipients=None)
    email_notification_sender.send_reservation_email(reservation=reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == getattr(email_template, f"subject_{language}", None)
    assert outbox[0].body == getattr(email_template, f"content_{language}", None)
    assert outbox[0].bcc == [reservation.user.email]


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
@override_settings(SEND_RESERVATION_NOTIFICATION_EMAILS=True)
def test_email_sender__reservation__staff_email_sent_in_default_language(outbox, language, email_template):
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo", reservee_language=language)

    # Change email template to one that is used for staff emails
    email_template.type = EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING
    email_template.save()

    # Create a user with permissions to manage reservations, who will receive the email
    staff_user = UserFactory.create_with_unit_role(
        units=[reservation.reservation_unit.first().unit],
        reservation_notification=ReservationNotification.ALL,
    )

    ReservationEmailNotificationSender._send_staff_requires_handling_email(reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == getattr(email_template, "subject_fi", None)
    assert outbox[0].body == getattr(email_template, "content_fi", None)
    assert outbox[0].bcc == [staff_user.email]


def test_email_sender__test_emails(outbox, email_template):
    form = EmailTemplateTesterForm()
    form.cleaned_data = {
        "recipient": "test@example.com",
        "reservee_name": "Test Name",
        "begin_datetime": datetime.datetime(2023, 2, 1, 12),
        "end_datetime": datetime.datetime(2023, 2, 1, 13),
        "reservation_number": 123,
        "unit_location": "Test location",
        "unit_name": "Test unit",
        "reservation_name": "Test reservation",
        "reservation_unit_name": "Test reservation unit",
        "price": Decimal("10.00"),
        "non_subsidised_price": Decimal("10.00"),
        "subsidised_price": Decimal("5.00"),
        "tax_percentage": Decimal("25.5"),
        "confirmed_instructions_fi": "Confirmed FI",
        "confirmed_instructions_en": "Confirmed EN",
        "confirmed_instructions_sv": "Confirmed SV",
        "pending_instructions_fi": "Pending FI",
        "pending_instructions_en": "Pending EN",
        "pending_instructions_sv": "Pending SV",
        "cancelled_instructions_fi": "Cancelled FI",
        "cancelled_instructions_en": "Cancelled EN",
        "cancelled_instructions_sv": "Cancelled SV",
        "deny_reason_fi": "Deny reason FI",
        "deny_reason_en": "Deny reason EN",
        "deny_reason_sv": "Deny reason SV",
        "cancel_reason_fi": "Cancel reason FI",
        "cancel_reason_en": "Cancel reason EN",
        "cancel_reason_sv": "Cancel reason SV",
    }

    email_notification_sender = EmailNotificationSender(email_type=email_template.type, recipients=None)
    email_notification_sender.send_test_reservation_email(form=form)

    assert len(outbox) == 3
    assert outbox[0].subject == "fi"
    assert outbox[0].body == "fi"
    assert outbox[0].bcc == ["test@example.com"]
    assert outbox[1].subject == "sv"
    assert outbox[1].body == "sv"
    assert outbox[1].bcc == ["test@example.com"]
    assert outbox[2].subject == "en"
    assert outbox[2].body == "en"
    assert outbox[2].bcc == ["test@example.com"]
