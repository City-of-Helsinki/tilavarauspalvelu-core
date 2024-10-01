import pytest

from tests.factories import ApplicationFactory, EmailTemplateFactory
from tests.helpers import patch_method
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.models import Application, EmailTemplate
from tilavarauspalvelu.utils.email.email_builder_application import ApplicationEmailBuilder
from tilavarauspalvelu.utils.email.email_validator import EmailTemplateValidator

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def email_template() -> EmailTemplate:
    return EmailTemplateFactory.build(
        type=EmailType.APPLICATION_RECEIVED,
        name="Test template",
        subject_fi="Subject FI",
        subject_en="Subject EN",
        subject_sv="Subject SV",
    )


@pytest.fixture
def application() -> Application:
    return ApplicationFactory.create(user__preferred_language="fi")


# Get Subject


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
@patch_method(EmailTemplateValidator.render_template)
def test_email_builder__get_subject(language, email_template, application):
    EmailTemplateValidator.render_template.return_value = f"HTML content {language or "fi"}"

    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_subject() == f"Subject {language.upper()}"


# Get HTML Content


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
@patch_method(EmailTemplateValidator.render_template)
def test_email_builder__get_content__with_html_file(language, email_template, application):
    EmailTemplateValidator.render_template.return_value = f"HTML content {language or "fi"}"

    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_html_content() == f"HTML content {language}"


# Get Text Content


@pytest.mark.parametrize("language", ["fi", "en", "sv", None])
@patch_method(EmailTemplateValidator.render_template)
def test_email_builder__get_content__with_text_content(language, email_template, application):
    EmailTemplateValidator.render_template.return_value = f"Text content {language or "fi"}"

    application.user.preferred_language = language
    builder = ApplicationEmailBuilder.from_application(template=email_template, application=application)

    if language is None:
        language = "fi"
    assert builder.get_content() == f"Text content {language}"
