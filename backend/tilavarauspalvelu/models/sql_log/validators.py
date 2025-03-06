from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import SQLLog


__all__ = [
    "SQLLogValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SQLLogValidator:
    sql_log: SQLLog
