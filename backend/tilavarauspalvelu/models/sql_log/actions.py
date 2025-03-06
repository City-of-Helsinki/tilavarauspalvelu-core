from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import SQLLog


__all__ = [
    "SQLLogActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SQLLogActions:
    sql_log: SQLLog
