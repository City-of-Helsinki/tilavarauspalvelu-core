import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from applications.models import Application
from email_notification.helpers.email_builder_application import ApplicationEmailBuilder
from email_notification.models import EmailTemplate, EmailType
from tests.factories import ApplicationFactory, EmailTemplateFactory

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture()
def email_template() -> EmailTemplate:
    html_file_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML content FI")
    html_file_en = SimpleUploadedFile(name="mock_file_en.html", content=b"HTML content EN")
    html_file_sv = SimpleUploadedFile(name="mock_file_sv.html", content=b"HTML content SV")

    return EmailTemplateFactory.build(
        type=EmailType.APPLICATION_RECEIVED,
        name="Test template",
        subject_fi="Subject FI",
        subject_en="Subject EN",
        subject_sv="Subject SV",
        content_fi="Text content FI",
        content_en="Text content EN",
        content_sv="Text content SV",
        html_content_fi=html_file_fi,
        html_content_en=html_file_en,
        html_content_sv=html_file_sv,
    )


@pytest.fixture()
def application() -> Application:
    return ApplicationFactory.create(user__preferred_language="fi")


# Get Subject


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
def test_email_builder__get_subject(language, email_template, application):
    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_subject() == f"Subject {language.upper()}"


# Get HTML Content


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
def test_email_builder__get_content__with_html_file(language, email_template, application):
    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_html_content() == f"HTML content {language.upper()}"


# Get Text Content


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
def test_email_builder__get_content__with_text_content(language, email_template, application):
    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_content() == f"Text content {language.upper()}"
