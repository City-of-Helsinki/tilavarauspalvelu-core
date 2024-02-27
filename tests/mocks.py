from typing import Any

from requests import PreparedRequest, Response


class MockRequest(PreparedRequest):
    def __init__(self, method: str = "get") -> None:
        super().__init__()
        self.method = method


class MockResponse(Response):
    def __init__(self, json: dict[str, Any], status_code: int, method: str = "get") -> None:
        super().__init__()
        self._json = json
        self.status_code = status_code
        self.request = MockRequest(method)
        self.url = "http://example.com"

    def json(self, *args, **kwargs) -> dict[str, Any]:
        return self._json
