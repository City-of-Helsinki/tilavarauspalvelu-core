from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Qualifier


__all__ = [
    "QualifierValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class QualifierValidator:
    qualifier: Qualifier
