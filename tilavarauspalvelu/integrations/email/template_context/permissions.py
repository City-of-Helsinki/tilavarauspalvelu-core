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
    link = get_staff_login_link(language=language)
    link_tag = create_anchor_tag(link=link)

    return {
        "title": pgettext("Email", "Your permissions in Varaamo are going to be deactivated"),
        "text_permission_deactivation": pgettext(
            "Email",
            # NOTE: Must format like this so that Django can discover the translation.
            "Your account in Varaamo has staff permissions. Since you haven't logged in for a while, "
            "these permissions are going to be revoked.",
        ),
        "text_login_to_prevent": pgettext(
            "Email",
            "You can login to Varaamo here to prevent this from happening",
        ),
        "login_url": link,
        "login_url_html": link_tag,
        **get_contex_for_base_template(language=language),
        **get_contex_for_closing(language=language),
    }


@get_translated
def get_context_for_user_anonymization(*, language: Lang) -> EmailContext:
    link = get_varaamo_ext_link(language=language)
    link_tag = create_anchor_tag(link=link)

    return {
        "title": pgettext("Email", "The data in your Varaamo account will be removed soon"),
        "text_user_anonymization": pgettext(
            "Email",
            "Your account in Varaamo has not been used for a while. The data in your account will be removed soon.",
        ),
        "text_login_to_prevent": pgettext(
            "Email",
            "You can login to Varaamo here to prevent this from happening",
        ),
        "login_url": link,
        "login_url_html": link_tag,
        **get_contex_for_base_template(language=language),
        **get_contex_for_closing(language=language),
    }
