from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import OriginHaukiResource


__all__ = [
    "OriginHaukiResourceValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class OriginHaukiResourceValidator:
    origin_hauki_resource: OriginHaukiResource
