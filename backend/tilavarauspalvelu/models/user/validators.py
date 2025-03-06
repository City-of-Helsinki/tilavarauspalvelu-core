from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User


__all__ = [
    "UserValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UserValidator:
    user: User
