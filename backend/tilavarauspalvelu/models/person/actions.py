from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Person


class PersonActions:
    def __init__(self, person: Person) -> None:
        self.person = person
