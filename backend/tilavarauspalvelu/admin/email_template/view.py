from __future__ import annotations

from typing import TYPE_CHECKING, Any

from admin_data_views.typing import TableContext
from admin_data_views.utils import render_with_table_view
from django.http import HttpResponse

from tilavarauspalvelu.admin.email_template.utils import get_mock_data, get_preview_links, get_tester_link
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.integrations.email.typing import EmailType

if TYPE_CHECKING:
    from django.utils.safestring import SafeString

    from tilavarauspalvelu.integrations.email.typing import EmailTemplateType
    from tilavarauspalvelu.typing import Lang, WSGIRequest


@render_with_table_view
def email_templates_admin_list_view(request: WSGIRequest, **kwargs: Any) -> TableContext:
    links_html: list[SafeString] = []
    links_text: list[SafeString] = []
    tester_links: list[SafeString] = []

    for email_template_type in EmailType.options:
        link_html = get_preview_links(email_template_type)
        links_html.append(link_html)

        link_text = get_preview_links(email_template_type, text=True)
        links_text.append(link_text)

        tester_link = get_tester_link(email_template_type)
        tester_links.append(tester_link)

    return TableContext(
        title="Email templates",
        table={
            "Template": tester_links,
            "HTML": links_html,
            "Text": links_text,
        },
    )


def email_type_admin_view(request: WSGIRequest, email_type: str) -> HttpResponse:
    try:
        email_template_type = EmailType.get(email_type)
    except ValueError:
        return HttpResponse("Invalid email type")

    as_html = request.GET.get("text", "false").lower() not in {"true", "1", "t"}
    language: Lang = request.GET.get("lang", "fi")
    if language not in {"fi", "en", "sv"}:
        language = "fi"

    content = render_with_mock_data(email_type=email_template_type, language=language, as_html=as_html)
    if content is None:
        return HttpResponse(f"Email type '{email_template_type}' template not implemented.")
    return HttpResponse(content)


def render_with_mock_data(*, email_type: EmailTemplateType, language: Lang, as_html: bool) -> str | None:
    context = get_mock_data(email_type=email_type, language=language)

    if as_html:
        return render_html(email_type=email_type, context=context)

    # Add <pre> tags to so that whitespace is preserved
    return "<pre>" + render_text(email_type=email_type, context=context) + "</pre>"
