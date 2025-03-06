from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Person


__all__ = [
    "PersonActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PersonActions:
    person: Person
