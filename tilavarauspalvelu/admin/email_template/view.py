from typing import TYPE_CHECKING

from admin_data_views.settings import admin_data_settings
from admin_data_views.typing import TableContext
from admin_data_views.utils import render_with_table_view
from django.http import HttpResponse
from django.urls import reverse
from django.utils.html import format_html

from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.integrations.email.rendering import render_html, render_text
from tilavarauspalvelu.typing import Lang, WSGIRequest

from .utils import get_mock_data

if TYPE_CHECKING:
    from django.utils.safestring import SafeString


@render_with_table_view
def email_templates_admin_list_view(request: WSGIRequest, **kwargs) -> TableContext:
    links_html: list[SafeString] = []
    links_text: list[SafeString] = []
    tester_links: list[SafeString] = []

    for email_type, label in EmailType.choices:
        base_url = reverse(
            viewname="admin:view_email_type",
            kwargs={"email_type": email_type},
            current_app=admin_data_settings.NAME,
        )

        link_html_fi = format_html('<a href="{}">{}</a>', base_url + "?lang=fi", "FI")
        link_html_en = format_html('<a href="{}">{}</a>', base_url + "?lang=en", "EN")
        link_html_sv = format_html('<a href="{}">{}</a>', base_url + "?lang=sv", "SV")
        link_html = format_html("<span>{} / {} / {}</span>", link_html_fi, link_html_en, link_html_sv)

        links_html.append(link_html)

        link_text_fi = format_html('<a href="{}">{}</a>', base_url + "?lang=fi&text=true", "FI")
        link_text_en = format_html('<a href="{}">{}</a>', base_url + "?lang=en&text=true", "EN")
        link_text_sv = format_html('<a href="{}">{}</a>', base_url + "?lang=sv&text=true", "SV")
        link_text = format_html("<span>{} / {} / {}</span>", link_text_fi, link_text_en, link_text_sv)

        links_text.append(link_text)

        tester_url = reverse(
            "admin:email_tester",
            kwargs={"email_type": email_type},
            current_app=admin_data_settings.NAME,
        )

        tester_link = format_html('<a href="{}">{}</a>', tester_url, label)
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
        email_type = EmailType(email_type)
    except Exception:
        return HttpResponse("Invalid email type")

    as_html = request.GET.get("text", "false").lower() not in ("true", "1", "t")
    language: Lang = request.GET.get("lang", "fi")
    if language not in ("fi", "en", "sv"):
        language = "fi"

    content = render_with_mock_data(email_type=email_type, language=language, as_html=as_html)
    if content is None:
        return HttpResponse(f"Email type '{email_type}' template not implemented.")
    return HttpResponse(content)


def render_with_mock_data(*, email_type: EmailType, language: Lang, as_html: bool) -> str | None:
    context = get_mock_data(email_type=email_type, language=language)

    if as_html:
        return render_html(email_type=email_type, context=context)

    # Add <pre> tags to so that whitespace is preserved
    return "<pre>" + render_text(email_type=email_type, context=context) + "</pre>"
