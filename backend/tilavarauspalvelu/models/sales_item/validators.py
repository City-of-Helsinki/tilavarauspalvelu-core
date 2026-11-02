from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import SalesItem


__all__ = [
    "SalesItemValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SalesItemValidator:
    sales_item: SalesItem
