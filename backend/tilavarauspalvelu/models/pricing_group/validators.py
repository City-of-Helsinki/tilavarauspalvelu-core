from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PricingGroup


__all__ = [
    "PricingGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PricingGroupValidator:
    pricing_group: PricingGroup
