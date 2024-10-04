import pytest
from jinja2 import FileSystemLoader
from jinja2.sandbox import SandboxedEnvironment

from config.utils.commons import LanguageType
from tests.factories import EmailTemplateFactory, ReservationFactory
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.email_builder_application import ApplicationEmailBuilder
from tilavarauspalvelu.integrations.email.email_builder_reservation import ReservationEmailBuilder
from tilavarauspalvelu.templatetags import format_currency

pytestmark = [
    pytest.mark.django_db,
]


def test_email__all_email_types_have_a_builder_class():
    """Every email type should be given a builder"""
    builder_types = ReservationEmailBuilder.email_template_types + ApplicationEmailBuilder.email_template_types

    assert set(EmailType) == set(builder_types)


@pytest.mark.parametrize("email_type", EmailType)
def test_email__all_email_types_text_and_email_templates_exist(email_type):
    """Make sure that every EmailType has a corresponding text and email jinja template."""
    env = SandboxedEnvironment(loader=FileSystemLoader("templates"))
    env.filters["currency"] = format_currency

    email_template = EmailTemplateFactory.create(type=email_type)
    env.get_template(email_template.text_template_path)
    env.get_template(email_template.html_template_path)


@pytest.mark.parametrize("email_type", ReservationEmailBuilder.email_template_types)
@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email__reservation_types__render_successfully(email_type, language: LanguageType):
    """Make sure everything renders, and that there are no jinja2 tags left in the content."""
    builder = ReservationEmailBuilder.from_reservation(
        template=EmailTemplateFactory.create(type=email_type),
        reservation=ReservationFactory.create_for_staff_update(),
        forced_language=language,
    )

    builder.get_subject()

    content = builder.get_content()
    assert "{{" not in content
    assert "{%" not in content

    html_content = builder.get_html_content()
    assert "{{" not in html_content
    assert "{%" not in html_content


@pytest.mark.parametrize("email_type", ApplicationEmailBuilder.email_template_types)
@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email__application_types__render_successfully(email_type, language: LanguageType):
    """Make sure everything renders, and that there are no jinja2 tags left in the content."""
    builder = ApplicationEmailBuilder.build(
        template=EmailTemplateFactory.create(type=email_type),
        language=language,
    )

    builder.get_subject()

    content = builder.get_content()
    assert "{{" not in content
    assert "{%" not in content

    html_content = builder.get_html_content()
    assert "{{" not in html_content
    assert "{%" not in html_content
