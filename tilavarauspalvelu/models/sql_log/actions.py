from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import SQLLog


class SQLLogActions:
    def __init__(self, sql_log: SQLLog) -> None:
        self.sql_log = sql_log
