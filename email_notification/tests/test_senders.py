import datetime
from decimal import Decimal
from unittest.mock import patch

from assertpy import assert_that
from django.conf import settings
from django.core import mail
from django.test import override_settings

from email_notification.models import EmailType
from email_notification.sender.senders import (
    send_reservation_email_notification,
    send_test_emails,
)
from email_notification.tests.base import ReservationEmailBaseTestCase
from email_notification.tests.factories import EmailTemplateFactory


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SendReservationEmailNotificationTestCase(ReservationEmailBaseTestCase):
    def test_send_email_success(self):
        send_reservation_email_notification(
            EmailType.RESERVATION_CONFIRMED, self.reservation
        )
        should_be_body = f"This is the {self.reservation.id } content"
        should_be_subject = f"Los subjectos { self.reservation.name }"

        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to(should_be_subject)
        assert_that(mail.outbox[0].body).is_equal_to(should_be_body)
        assert_that(mail.outbox[0].bcc).is_equal_to([self.reservation.reservee_email])

    def test_send_email_with_multiple_recipients_success(self):
        recipients = [
            "liu.kang@earthrealm.com",
            "sonya.blade@earthrealm.com",
            "shao.kahn@outworld.com",
            "mileena@outworld.com",
        ]
        send_reservation_email_notification(
            EmailType.RESERVATION_CONFIRMED, self.reservation, recipients
        )
        should_be_body = f"This is the { self.reservation.id } content"
        should_be_subject = f"Los subjectos { self.reservation.name }"

        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to(should_be_subject)
        assert_that(mail.outbox[0].body).is_equal_to(should_be_body)
        assert_that(mail.outbox[0].bcc).is_equal_to(recipients)

    @override_settings(EMAIL_MAX_RECIPIENTS=3)
    def test_send_email_with_long_recipient_list_fails(self):
        recipients = [
            "liu.kang@earthrealm.com",
            "sonya.blade@earthrealm.com",
            "shao.kahn@outworld.com",
            "mileena@outworld.com",
        ]

        exception = (
            assert_that(send_reservation_email_notification)
            .raises(Exception)
            .when_called_with(
                EmailType.RESERVATION_CONFIRMED, self.reservation, recipients
            )
            .val
        )
        assert_that(exception).contains(
            f"Refusing to notify more than {settings.EMAIL_MAX_RECIPIENTS} users."
        )

    def test_reservation_language_is_used(self):
        self.reservation.reservee_language = "en"
        self.reservation.save()
        send_reservation_email_notification(
            EmailType.RESERVATION_CONFIRMED, self.reservation
        )
        should_be_body = f"This is the {self.reservation.id} content in english"
        should_be_subject = f"Los subjectos inglesa {self.reservation.name}"

        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to(should_be_subject)
        assert_that(mail.outbox[0].body).is_equal_to(should_be_body)
        assert_that(mail.outbox[0].bcc).is_equal_to([self.reservation.reservee_email])

    @patch("email_notification.email_tester.EmailTestForm")
    def test_send_test_emails(self, mock_form):
        template = EmailTemplateFactory.create(
            name="Test template",
            subject_fi="Otsikko",
            subject_en="Subject",
            subject_sv="Ämne",
            content_fi="Sisältö",
            content_en="Content",
            content_sv="Innehåll",
        )
        mock_form.cleaned_data = {
            "recipient": "test@example.com",
            "reservee_name": "Test Name",
            "begin_datetime": datetime.datetime(2023, 2, 1, 12, 00, 00),
            "end_datetime": datetime.datetime(2023, 2, 1, 13, 00, 00),
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
        send_test_emails(template, mock_form)
        assert_that(len(mail.outbox)).is_equal_to(3)
        assert_that(mail.outbox[0].subject).is_equal_to("Otsikko")
        assert_that(mail.outbox[0].body).is_equal_to("Sisältö")
        assert_that(mail.outbox[0].bcc).is_equal_to(["test@example.com"])
        assert_that(mail.outbox[1].subject).is_equal_to("Ämne")
        assert_that(mail.outbox[1].body).is_equal_to("Innehåll")
        assert_that(mail.outbox[1].bcc).is_equal_to(["test@example.com"])
        assert_that(mail.outbox[2].subject).is_equal_to("Subject")
        assert_that(mail.outbox[2].body).is_equal_to("Content")
        assert_that(mail.outbox[2].bcc).is_equal_to(["test@example.com"])
