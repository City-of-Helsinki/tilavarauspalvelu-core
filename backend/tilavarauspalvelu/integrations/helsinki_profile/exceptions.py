from __future__ import annotations

from typing import Any

from utils.external_service.errors import ExternalServiceError


class HelsinkiProfileError(ExternalServiceError):
    def __init__(self, message: str = "", *, extra_data: Any = None) -> None:
        super().__init__(message)
        self.extra_data = extra_data
