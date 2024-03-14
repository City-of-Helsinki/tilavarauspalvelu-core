import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from email_notification.exceptions import EmailNotificationBuilderError, EmailTemplateValidationError
from email_notification.models import EmailTemplate
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    ReservationEmailNotificationBuilder,
)
from reservations.models import Reservation
from tests.factories import EmailTemplateFactory, ReservationFactory

pytestmark = [
    pytest.mark.django_db,
]

mock_data = EmailNotificationContext.with_mock_data()


@pytest.fixture()
def email_template() -> EmailTemplate:
    html_file_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML content FI")
    html_file_en = SimpleUploadedFile(name="mock_file_en.html", content=b"HTML content EN")
    html_file_sv = SimpleUploadedFile(name="mock_file_sv.html", content=b"HTML content SV")

    return EmailTemplateFactory.build(
        name="Test template",
        content_fi="Text content FI",
        content_en="Text content EN",
        content_sv="Text content SV",
        html_content_fi=html_file_fi,
        html_content_en=html_file_en,
        html_content_sv=html_file_sv,
    )


@pytest.fixture()
def reservation() -> Reservation:
    return ReservationFactory.create(
        name="Test reservation",
        reservation_unit__name="Test reservation unit",
        reservation_unit__unit__name="Test unit",
    )


def test_constructor_raises_error_on_invalid_text_content(email_template, reservation):
    email_template.content_fi = "Text content FI {{invalid_tag}}"

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation=reservation, template=email_template, language="fi")


def test_constructor_raises_error_on_invalid_html_content(email_template, reservation):
    email_template.html_content_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML FI {{invalid_tag}}")

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation=reservation, template=email_template, language="fi")


def test_constructor_raises_error_when_reservation_and_context_are_given(email_template, reservation):
    context = EmailNotificationContext.from_reservation(reservation)
    msg = "Reservation and context cannot be used at the same time. Provide only one of them."
    with pytest.raises(EmailNotificationBuilderError, match=msg):
        ReservationEmailNotificationBuilder(
            reservation=reservation, template=email_template, language="fi", context=context
        )


def test_get_content_with_html_file(email_template, reservation):
    builder_fi = ReservationEmailNotificationBuilder(reservation, email_template, "fi")
    builder_en = ReservationEmailNotificationBuilder(reservation, email_template, "en")
    builder_sv = ReservationEmailNotificationBuilder(reservation, email_template, "sv")

    assert builder_fi.get_html_content() == "HTML content FI"
    assert builder_en.get_html_content() == "HTML content EN"
    assert builder_sv.get_html_content() == "HTML content SV"


def test_get_content_with_text_content(email_template, reservation):
    builder_fi = ReservationEmailNotificationBuilder(reservation, email_template, "fi")
    builder_en = ReservationEmailNotificationBuilder(reservation, email_template, "en")
    builder_sv = ReservationEmailNotificationBuilder(reservation, email_template, "sv")

    assert builder_fi.get_content() == "Text content FI"
    assert builder_en.get_content() == "Text content EN"
    assert builder_sv.get_content() == "Text content SV"
