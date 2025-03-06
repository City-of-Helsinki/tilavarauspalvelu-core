from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Purpose


__all__ = [
    "PurposeValidator",
]


@dataclasses.dataclass
class PurposeValidator:
    purpose: Purpose
