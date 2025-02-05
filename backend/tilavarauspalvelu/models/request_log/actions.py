from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import RequestLog


class RequestLogActions:
    def __init__(self, request_log: RequestLog) -> None:
        self.request_log = request_log
