from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import KeywordGroup


class KeywordGroupActions:
    def __init__(self, keyword_group: "KeywordGroup") -> None:
        self.keyword_group = keyword_group
