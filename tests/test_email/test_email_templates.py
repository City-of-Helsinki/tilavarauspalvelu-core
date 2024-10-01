import pytest
from jinja2 import FileSystemLoader
from jinja2.sandbox import SandboxedEnvironment

from tests.factories import EmailTemplateFactory
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.templatetags import format_currency

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("email_type", EmailType)
def test_email__all_email_types_text_and_email_templates_exist(email_type):
    """Make sure that every EmailType has a corresponding text and email jinja template."""
    env = SandboxedEnvironment(loader=FileSystemLoader("templates"))
    env.filters["currency"] = format_currency

    email_template = EmailTemplateFactory.create(type=email_type)
    env.get_template(email_template.text_template_path)
    env.get_template(email_template.html_template_path)
