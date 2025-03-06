from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Person


__all__ = [
    "PersonValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PersonValidator:
    person: Person
