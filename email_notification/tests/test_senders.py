from assertpy import assert_that
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
        assert_that(mail.outbox[0].to).is_equal_to([self.reservation.reservee_email])

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
        assert_that(mail.outbox[0].to).is_equal_to([self.reservation.reservee_email])
