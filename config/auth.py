from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth

from common.utils import update_query_params
from users.models import User, get_user

if TYPE_CHECKING:
    from common.typing import WSGIRequest
    from users.helauth.typing import TokenResponse


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

    def get_end_session_url(self, request: WSGIRequest, id_token: str) -> str | None:
        url = self.oidc_config().get("end_session_endpoint")

        params = {
            "id_token_hint": id_token,
            "post_logout_redirect_uri": request.build_absolute_uri(settings.LOGOUT_REDIRECT_URL),
        }

        with suppress(Exception):
            return update_query_params(url, **params)

        return None

    def get_token_for_profile(self, access_token: str) -> TokenResponse:
        url = self.access_token_url()
        request_args = {
            "method": "POST",
            "headers": {
                **self.auth_headers(),
                "Authorization": f"Bearer {access_token}",
            },
            "data": {
                "audience": settings.OPEN_CITY_PROFILE_SCOPE,
                "grant_type": "urn:ietf:params:oauth:grant-type:uma-ticket",
                "permission": "#access",
            },
        }
        response = self.request(url, **request_args)
        return response.json()

    def request_access_token(self, *args: Any, **kwargs: Any) -> Any:
        # This is a hack that can be enabled for local development if you get
        # errors during authentication for "The token is not yet valid (iat)".
        # These happens due to incorrect implementation for checking issued at time in
        # `jwt.api_jwt.PyJWT._validate_iat` (`iat` is an int while `now` is a float,
        # which can be a few milliseconds off if the server authenticated too fast).
        if settings.UNSAFE_SKIP_IAT_CLAIM_VALIDATION:
            from unittest.mock import patch

            # Simply skips the checks.
            path = "jwt.api_jwt.PyJWT._validate_iat"
            with patch(path):
                return super().request_access_token(*args, **kwargs)
        else:
            return super().request_access_token(*args, **kwargs)


class ProxyModelBackend(ModelBackend):
    """
    Enables configuring the Model backend directly (used for django-admin login).
    `AUTHENTICATION_BACKENDS` setting points to this.
    """

    def get_user(self, user_id: Any = None) -> User | None:
        return get_user(user_id) if user_id is not None else None
