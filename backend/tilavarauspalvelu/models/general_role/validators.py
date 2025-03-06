from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import GeneralRole


__all__ = [
    "GeneralRoleValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class GeneralRoleValidator:
    general_role: GeneralRole
