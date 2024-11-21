from __future__ import annotations

from typing import TYPE_CHECKING

from django.utils.translation import pgettext

from tilavarauspalvelu.translation import get_translated

from .common import (
    create_anchor_tag,
    get_contex_for_base_template,
    get_contex_for_closing,
    get_staff_login_link,
    get_varaamo_ext_link,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import EmailContext, Lang

__all__ = [
    "get_context_for_permission_deactivation",
]


@get_translated
def get_context_for_permission_deactivation(*, language: Lang) -> EmailContext:
    link = get_staff_login_link()
    link_tag = create_anchor_tag(link=link)

    return {
        "title": pgettext("Email", "Your staff access to Varaamo is expiring"),
        "text_permission_deactivation": pgettext(
            "Email",
            "Your staff access to Varaamo will expire if you do not log in to the service within two weeks.",
        ),
        "text_login_to_prevent": pgettext("Email", "Log in to the service at"),
        "login_url": link,
        "login_url_html": link_tag,
        **get_contex_for_base_template(),
        **get_contex_for_closing(language=language),
    }


@get_translated
def get_context_for_user_anonymization(*, language: Lang) -> EmailContext:
    link = get_varaamo_ext_link(language=language)
    link_tag = create_anchor_tag(link=link)

    return {
        "title": pgettext("Email", "Your user account in the Varaamo service is expiring"),
        "text_user_anonymization": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "Your user account in the Varaamo service will expire if you do not log in within two weeks. "
            "The information will be permanently deleted if your account expires.",
        ),
        "text_login_to_prevent": pgettext(
            "Email",
            "You can extend the validity of your user account by logging into the service at",
        ),
        "login_url": link,
        "login_url_html": link_tag,
        **get_contex_for_base_template(),
        **get_contex_for_closing(language=language),
    }
