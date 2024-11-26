from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Space


class SpaceActions:
    def __init__(self, space: Space) -> None:
        self.space = space
