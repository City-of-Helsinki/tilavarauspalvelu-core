from functools import partial
from typing import Any
from unittest.mock import Mock

from requests import Response


class MockResponse(Response):
    def __init__(self, json: dict[str, Any], status_code: int) -> None:
        super().__init__()
        self._json = json
        self.status_code = status_code

    def json(self, *args, **kwargs) -> dict[str, Any]:
        return self._json


def _mock_response(json: dict[str, Any], status_code: int) -> Mock:
    return Mock(return_value=MockResponse(json, status_code))


mock_post = partial(_mock_response, status_code=201)
mock_get = partial(_mock_response, status_code=200)
