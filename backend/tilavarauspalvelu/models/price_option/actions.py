from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PriceOption


__all__ = [
    "PriceOptionActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PriceOptionActions:
    price_option: PriceOption
