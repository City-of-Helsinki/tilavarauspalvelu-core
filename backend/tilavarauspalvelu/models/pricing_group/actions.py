from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PricingGroup


__all__ = [
    "PricingGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PricingGroupActions:
    pricing_group: PricingGroup
