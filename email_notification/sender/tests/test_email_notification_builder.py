from assertpy import assert_that
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from pytest import raises

from email_notification.tests.factories import EmailTemplateFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import UnitFactory

from ..email_notification_builder import (
    EmailNotificationContext,
    EmailTemplateValidationError,
    ReservationEmailNotificationBuilder,
    ReservationEmailNotificationBuilderException,
)


class EmailNotificationBuilderTestCase(TestCase):
    def setUp(self) -> None:
        self.unit = UnitFactory(name="Test unit")
        self.reservation_unit = ReservationUnitFactory(name="Test reservation unit", unit=self.unit)
        self.reservation = ReservationFactory(name="Test reservation", reservation_unit=[self.reservation_unit])

    def test_constructor_raises_error_on_invalid_text_content(self):
        template = EmailTemplateFactory(name="Test template", content_fi="Text content FI {{invalid_tag}}")
        with raises(EmailTemplateValidationError) as err:
            ReservationEmailNotificationBuilder(self.reservation, template, "fi")
        assert_that(err.value.message).is_equal_to("Tag invalid_tag not supported")

    def test_constructor_raises_error_on_invalid_html_content(self):
        html_file = SimpleUploadedFile(name="mock_file.html", content=b"HTML content FI {{invalid_tag}}")
        template = EmailTemplateFactory(
            name="Test template",
            content_fi="Text content FI",
            html_content_fi=html_file,
        )
        with raises(EmailTemplateValidationError) as err:
            ReservationEmailNotificationBuilder(self.reservation, template, "fi")
        assert_that(err.value.message).is_equal_to("Tag invalid_tag not supported")

    def test_constructor_raises_error_when_reservation_and_context_are_given(self):
        template = EmailTemplateFactory(name="Test template", content_fi="Text content FI {{invalid_tag}}")
        context = EmailNotificationContext.from_reservation(self.reservation)
        with raises(ReservationEmailNotificationBuilderException) as err:
            ReservationEmailNotificationBuilder(self.reservation, template, "fi", context=context)
        assert_that(str(err.value)).is_equal_to(
            "Reservation and context cannot be used at the same time. Provide only one of them."
        )

    def test_get_content_with_html_file(self):
        html_file_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML content FI")
        html_file_en = SimpleUploadedFile(name="mock_file_en.html", content=b"HTML content EN")
        html_file_sv = SimpleUploadedFile(name="mock_file_sv.html", content=b"HTML content SV")

        template = EmailTemplateFactory(
            name="Test template",
            content_fi="Text content FI",
            content_en="Text content EN",
            content_sv="Text content SV",
            html_content_fi=html_file_fi,
            html_content_en=html_file_en,
            html_content_sv=html_file_sv,
        )

        builder_fi = ReservationEmailNotificationBuilder(self.reservation, template, "fi")
        builder_en = ReservationEmailNotificationBuilder(self.reservation, template, "en")
        builder_sv = ReservationEmailNotificationBuilder(self.reservation, template, "sv")

        assert_that(builder_fi.get_html_content()).is_equal_to("HTML content FI")
        assert_that(builder_en.get_html_content()).is_equal_to("HTML content EN")
        assert_that(builder_sv.get_html_content()).is_equal_to("HTML content SV")

    def test_get_content_with_text_content(self):
        template = EmailTemplateFactory(
            name="Test template",
            content_fi="Text content FI",
            content_en="Text content EN",
            content_sv="Text content SV",
        )

        builder_fi = ReservationEmailNotificationBuilder(self.reservation, template, "fi")
        builder_en = ReservationEmailNotificationBuilder(self.reservation, template, "en")
        builder_sv = ReservationEmailNotificationBuilder(self.reservation, template, "sv")

        assert_that(builder_fi.get_content()).is_equal_to("Text content FI")
        assert_that(builder_en.get_content()).is_equal_to("Text content EN")
        assert_that(builder_sv.get_content()).is_equal_to("Text content SV")
