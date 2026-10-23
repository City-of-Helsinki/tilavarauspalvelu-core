from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PriceComponent


__all__ = [
    "PriceComponentActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PriceComponentActions:
    price_component: PriceComponent
