from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RequestLog


__all__ = [
    "RequestLogValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class RequestLogValidator:
    request_log: RequestLog
