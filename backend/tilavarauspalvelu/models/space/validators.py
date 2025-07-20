from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Resource


__all__ = [
    "SpaceValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SpaceValidator:
    resource: Resource
