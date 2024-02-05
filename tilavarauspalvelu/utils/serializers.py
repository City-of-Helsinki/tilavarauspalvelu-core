# ruff: noqa: S301

import pickle  # nosec
from typing import Any


class PickleSerializer:
    # Pickle serializer from django 4.2, which was deprecated and removed due to security issues.
    #
    # `django-helusers` still requires this.
    # https://github.com/City-of-Helsinki/django-helusers#:~:text=Finally%2C%20you%20will%20need%20to

    def __init__(self, protocol: int | None = None) -> None:
        self.protocol = pickle.HIGHEST_PROTOCOL if protocol is None else protocol

    def dumps(self, obj: Any) -> bytes:
        return pickle.dumps(obj, self.protocol)  # nosec

    def loads(self, data: bytes) -> Any:
        return pickle.loads(data)  # nosec
