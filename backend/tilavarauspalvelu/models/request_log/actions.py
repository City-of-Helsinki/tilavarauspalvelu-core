from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import RequestLog


__all__ = [
    "RequestLogActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class RequestLogActions:
    request_log: RequestLog
