from typing import Any

from django.contrib.auth.backends import ModelBackend

from users.models import User, get_user

__all__ = [
    "ProxyModelBackend",
]


class ProxyModelBackend(ModelBackend):
    """
    Overriden accessing get_user for optimizing request user fetching.
    `AUTHENTICATION_BACKENDS` setting points to this.
    """

    def get_user(self, user_id: Any = None) -> User | None:
        return get_user(user_id) if user_id is not None else None
