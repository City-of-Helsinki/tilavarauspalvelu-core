from assertpy import assert_that
from django.conf import settings
from django.core import mail
from django.test import override_settings

from email_notification.models import EmailType
from email_notification.sender.senders import send_reservation_email_notification
from email_notification.tests.base import ReservationEmailBaseTestCase


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SendReservationEmailNotificationTestCase(ReservationEmailBaseTestCase):
    def test_send_email_success(self):
        send_reservation_email_notification(
            EmailType.RESERVATION_CONFIRMED, self.reservation
        )
        should_be_body = f"This is the { str(self.reservation.id).zfill(10) } content"
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
        should_be_body = f"This is the { str(self.reservation.id).zfill(10) } content"
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
        should_be_body = (
            f"This is the {str(self.reservation.id).zfill(10)} content in english"
        )
        should_be_subject = f"Los subjectos inglesa {self.reservation.name}"

        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to(should_be_subject)
        assert_that(mail.outbox[0].body).is_equal_to(should_be_body)
        assert_that(mail.outbox[0].bcc).is_equal_to([self.reservation.reservee_email])
