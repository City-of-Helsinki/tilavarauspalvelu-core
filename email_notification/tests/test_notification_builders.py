from assertpy import assert_that
from django.conf import settings
from django.test import override_settings

from email_notification.models import EmailType
from email_notification.sender.email_notification_builder import (
    EmailBuilderConfigError,
    EmailTemplateValidationError,
    ReservationEmailNotificationBuilder,
)
from email_notification.tests.base import ReservationEmailBaseTestCase
from email_notification.tests.factories import EmailTemplateFactory


class ReservationEmailNotificationBuilderTestCase(ReservationEmailBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.builder = ReservationEmailNotificationBuilder(
            cls.reservation, cls.email_template
        )

    def test_get_reservee_name(self):
        reservee_name_str = f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"
        assert_that(self.builder._get_reservee_name()).is_equal_to(reservee_name_str)

    def test_get_begin_time(self):
        assert_that(self.builder._get_begin_time()).is_equal_to("10:00")

    def test_get_begin_date(self):
        assert_that(self.builder._get_begin_date()).is_equal_to("09.02.2022")

    def test_get_reservation_number(self):
        resno = str(self.reservation.id).zfill(10)
        assert_that(self.builder._get_reservation_number()).is_equal_to(f"{resno}")

    def test_get_unit_location(self):
        location_str = f"{self.location.address_street} {self.location.address_zip} {self.location.address_city}"
        assert_that(self.builder._get_unit_location()).is_equal_to(location_str)

    def test_get_unit_name(self):
        assert_that(self.builder._get_unit_name()).is_equal_to(self.unit.name)

    @override_settings(
        EMAIL_TEMPLATE_CONTEXT_ATTRS=settings.EMAIL_TEMPLATE_CONTEXT_ATTRS
        + ["imnotdefined"]
    )
    def test_context_attr_map_fails_on_undefined_methods(self):
        with self.assertRaises(EmailBuilderConfigError):
            ReservationEmailNotificationBuilder(self.reservation, self.email_template)

    def test_validate_fails_on_init_when_unsupported_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing unsupported {{ taggie }} tag",
            subject="test",
            type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_validate_fails_on_init_when_illegal_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing illegal {% nastiness %} tag",
            subject="test",
            type=EmailType.HANDLING_REQUIRED_RESERVATION,
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_get_subject(self):
        subject = "Hello {{ reservee_name }}"
        compiled_subject = "Hello Let it Snow"

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_CANCELLED, subject=subject, content="content"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_subject()).is_equal_to(compiled_subject)

    def test_get_content(self):
        content = """
            Should contain {{ name }} and {{ begin_date }} and {{ begin_time }} and {{ end_date }}
            and {{ end_time }} and of course the {{ reservation_number }}
            Yours truly:
            system.
        """
        compiled_content = f"""
            Should contain Dance time! and 09.02.2022 and 10:00 and 09.02.2022
            and 12:00 and of course the {str(self.reservation.id).zfill(10)}
            Yours truly:
            system.
        """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)
