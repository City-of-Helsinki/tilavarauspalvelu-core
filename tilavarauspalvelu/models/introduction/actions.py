from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Introduction


class IntroductionActions:
    def __init__(self, introduction: Introduction) -> None:
        self.introduction = introduction
