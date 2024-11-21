from __future__ import annotations

from typing import TYPE_CHECKING

from django.utils.translation import pgettext

from tilavarauspalvelu.translation import get_translated

from .common import (
    create_anchor_tag,
    get_contex_for_base_template,
    get_contex_for_closing_polite,
    get_my_applications_ext_link,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_application_handled",
    "get_context_for_application_in_allocation",
    "get_context_for_application_received",
]


@get_translated
def get_context_for_application_handled(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext("Email", "You can view the result of the processing on the %(page)s")

    return {
        "title": pgettext("Email", "Your application has been processed"),
        "text_application_handled": pgettext("Email", "Your application has been processed"),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": f"{text}: {link}"},
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }


@get_translated
def get_context_for_application_in_allocation(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext("Email", "You can view the application you have sent on the %(page)s")

    return {
        "title": pgettext("Email", "Your application is being processed"),
        "text_application_in_allocation": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "The application deadline has passed. "
            "We will notify you of the result when your application has been processed.",
        ),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": f"{text}: {link}"},
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }


@get_translated
def get_context_for_application_received(*, language: Lang) -> EmailContext:
    link = get_my_applications_ext_link(language=language)
    text = pgettext("Email", "'My applications' page")

    text_view_application = pgettext(
        "Email",
        "You can edit your application on the %(page)s until the application deadline",
    )

    return {
        "title": pgettext("Email", "Your application has been received"),
        "text_application_received": pgettext("Email", "Thank you for your application"),
        "text_view_application_html": text_view_application % {"page": create_anchor_tag(link=link, text=text)},
        "text_view_application": text_view_application % {"page": text} + f": {link}",
        **get_contex_for_base_template(),
        **get_contex_for_closing_polite(language=language),
    }
