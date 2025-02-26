from __future__ import annotations

from typing import TYPE_CHECKING

import mjml
from django.template.loader import get_template

if TYPE_CHECKING:
    from django_jinja.backend import Template

    from tilavarauspalvelu.integrations.email.typing import EmailType
    from tilavarauspalvelu.typing import EmailContext


__all__ = [
    "render_html",
    "render_text",
]


def render_text(*, email_type: type[EmailType], context: EmailContext) -> str:
    template_text: Template = get_template(email_type.text_path)
    return template_text.render(context).strip()


def render_html(*, email_type: type[EmailType], context: EmailContext) -> str:
    # Assumes that all email HTML templates are written in MJML (as they should be to be compatible with Outlook)
    template_html: Template = get_template(email_type.html_path)
    mjml_content = template_html.render(context)
    return mjml.mjml2html(mjml_content).strip()
