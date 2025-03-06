from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import City


__all__ = [
    "CityValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class CityValidator:
    city: City
