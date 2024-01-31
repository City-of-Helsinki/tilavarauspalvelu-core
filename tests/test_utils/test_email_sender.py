import datetime
import re
from decimal import Decimal

import pytest

from email_notification.email_tester import EmailTestForm
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.senders import (
    SendReservationEmailNotificationException,
    send_reservation_email_notification,
    send_test_emails,
)
from reservations.models import Reservation
from tests.factories import EmailTemplateFactory, ReservationFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_send_email__success__reservee_email(outbox):
    email_template: EmailTemplate = EmailTemplateFactory.create(type=EmailType.RESERVATION_CONFIRMED)
    reservation: Reservation = ReservationFactory.create(
        reservee_email="example@email.com",
        user=None,
        reservation_unit__unit__name="foo",
    )

    send_reservation_email_notification(email_template.type, reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == [reservation.reservee_email]


def test_send_email__success__reservation_user_email(outbox):
    email_template: EmailTemplate = EmailTemplateFactory.create(type=EmailType.RESERVATION_CONFIRMED)
    reservation: Reservation = ReservationFactory.create(
        user__email="example@email.com",
        reservation_unit__unit__name="foo",
    )

    send_reservation_email_notification(email_template.type, reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == [reservation.user.email]


def test_send_email__success__reservee_and_user_email(outbox):
    email_template: EmailTemplate = EmailTemplateFactory.create(type=EmailType.RESERVATION_CONFIRMED)
    reservation: Reservation = ReservationFactory.create(
        reservee_email="example1@email.com",
        user__email="example2@email.com",
        reservation_unit__unit__name="foo",
    )

    send_reservation_email_notification(email_template.type, reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert sorted(outbox[0].bcc) == [reservation.reservee_email, reservation.user.email]


def test_send_email__with_multiple_recipients__success(outbox):
    email_template: EmailTemplate = EmailTemplateFactory.create(type=EmailType.RESERVATION_CONFIRMED)
    reservation: Reservation = ReservationFactory.create(
        reservation_unit__unit__name="foo",
    )

    recipients = [
        "liu.kang@earthrealm.com",
        "sonya.blade@earthrealm.com",
        "shao.kahn@outworld.com",
        "mileena@outworld.com",
    ]
    send_reservation_email_notification(EmailType.RESERVATION_CONFIRMED, reservation, recipients)

    assert len(outbox) == 1
    assert outbox[0].subject == email_template.subject
    assert outbox[0].body == email_template.content
    assert outbox[0].bcc == recipients


def test_send_email__with_multiple_recipients__too_many_recipients(outbox, settings):
    settings.EMAIL_MAX_RECIPIENTS = 3

    email_template: EmailTemplate = EmailTemplateFactory.create(type=EmailType.RESERVATION_CONFIRMED)
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo")

    recipients = [
        "liu.kang@earthrealm.com",
        "sonya.blade@earthrealm.com",
        "shao.kahn@outworld.com",
        "mileena@outworld.com",
    ]

    msg = re.escape(
        f"Refusing to notify more than {settings.EMAIL_MAX_RECIPIENTS} users. "
        f"Email type: {email_template.type}. "
        f"Reservation: {reservation.pk}"
    )
    with pytest.raises(SendReservationEmailNotificationException, match=msg):
        send_reservation_email_notification(EmailType.RESERVATION_CONFIRMED, reservation, recipients)


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_send_email__reservation_language_is_used(outbox, lang):
    email_template: EmailTemplate = EmailTemplateFactory.create(
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
    reservation: Reservation = ReservationFactory.create(reservation_unit__unit__name="foo", reservee_language=lang)

    send_reservation_email_notification(EmailType.RESERVATION_CONFIRMED, reservation)

    assert len(outbox) == 1
    assert outbox[0].subject == getattr(email_template, f"subject_{lang}", None)
    assert outbox[0].body == getattr(email_template, f"content_{lang}", None)
    assert outbox[0].bcc == [reservation.user.email]


def test_send_email__test_emails(outbox):
    email_template: EmailTemplate = EmailTemplateFactory.create(
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
    form = EmailTestForm()
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
        "tax_percentage": 24,
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

    send_test_emails(email_template, form)

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
