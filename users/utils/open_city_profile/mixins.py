from django.core.handlers.wsgi import WSGIRequest

from users.helauth.utils import get_profile_token


class ProfileReaderTokenMixin:
    def __get_token(self) -> str:
        request: WSGIRequest | None = getattr(self, "request", None)
        if not request:
            raise ValueError("Request is not set")

        token: str = get_profile_token(request)
        if not token:
            raise ValueError("Could not fetch open city profile token from session")

        return f"Bearer {token}"

    @property
    def token(self) -> str:
        return self.__get_token()
