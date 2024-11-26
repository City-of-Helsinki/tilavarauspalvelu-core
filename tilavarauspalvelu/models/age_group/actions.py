from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AgeGroup


class AgeGroupActions:
    def __init__(self, age_group: AgeGroup) -> None:
        self.age_group = age_group
