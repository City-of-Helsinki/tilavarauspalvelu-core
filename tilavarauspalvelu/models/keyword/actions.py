from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Keyword


class KeywordActions:
    def __init__(self, keyword: Keyword) -> None:
        self.keyword = keyword
