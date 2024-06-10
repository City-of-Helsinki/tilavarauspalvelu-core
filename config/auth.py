from typing import Any

from django.contrib.auth.backends import ModelBackend
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth

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


class ProxyModelBackend(ModelBackend):
    """
    Enables configuring the Model backend directly (used for django-admin login).
    `AUTHENTICATION_BACKENDS` setting points to this.
    """

    def get_user(self, user_id: Any = None) -> User | None:
        return get_user(user_id) if user_id is not None else None
