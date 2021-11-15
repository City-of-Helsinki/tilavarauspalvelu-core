from functools import partial
from typing import Any, Dict
from unittest.mock import Mock

from requests import Response


class MockResponse(Response):
    def __init__(self, json: Dict[str, Any], status_code: int) -> None:
        super().__init__()
        self._json = json
        self.status_code = status_code

    def json(self, *args, **kwargs) -> Dict[str, Any]:
        return self._json


def _mock_response(json: Dict[str, Any], status_code: int) -> Mock:
    return Mock(return_value=MockResponse(json, status_code))


mock_post = partial(_mock_response, status_code=201)
mock_get = partial(_mock_response, status_code=200)
