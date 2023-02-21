from rest_framework import HTTP_HEADER_ENCODING


class ProfileReaderTokenMixin:
    def __get_token(self):
        request = getattr(self, "request", None)

        if not request:
            raise ValueError("Request is not set")

        token = request.headers.get("X-Authorization", b"")

        if isinstance(token, str):
            token = token.encode(HTTP_HEADER_ENCODING)

        if token and not token.startswith(b"Bearer"):
            token = b"Bearer " + token

        return token

    @property
    def token(self):
        return self.__get_token()
