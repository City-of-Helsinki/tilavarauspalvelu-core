from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PriceComponent


__all__ = [
    "PriceComponentValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PriceComponentValidator:
    price_component: PriceComponent
