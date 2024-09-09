from contextlib import suppress
from typing import Any

from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth

from common.typing import TypeHintedWSGIRequest
from common.utils import update_query_params
from users.models import User, get_user

__all__ = [
    "ProxyModelBackend",
    "ProxyTunnistamoOIDCAuthBackend",
]


# The `get_user`-methods in these classes are called by
# `django.contrib.auth.get_user` when fetching the `request.user` object.


class ProxyTunnistamoOIDCAuthBackend(TunnistamoOIDCAuth):
    """
    Enables configuring the Tunnistamo OIDC backend directly.
    `AUTHENTICATION_BACKENDS` setting points to this.
    """

    def get_user(self, user_id: Any = None) -> User | None:
        return get_user(user_id) if user_id is not None else None

    def get_end_session_url(self, request: TypeHintedWSGIRequest, id_token: str) -> str | None:
        url = self.oidc_config().get("end_session_endpoint")

        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": request.build_absolute_uri(settings.LOGOUT_REDIRECT_URL),
        }

        with suppress(Exception):
            return update_query_params(url, **params)

        return None


class ProxyModelBackend(ModelBackend):
    """
    Enables configuring the Model backend directly (used for django-admin login).
    `AUTHENTICATION_BACKENDS` setting points to this.
    """

    def get_user(self, user_id: Any = None) -> User | None:
        return get_user(user_id) if user_id is not None else None
