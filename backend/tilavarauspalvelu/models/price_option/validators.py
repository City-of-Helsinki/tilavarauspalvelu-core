from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PriceOption


__all__ = [
    "PriceOptionValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PriceOptionValidator:
    price_option: PriceOption
