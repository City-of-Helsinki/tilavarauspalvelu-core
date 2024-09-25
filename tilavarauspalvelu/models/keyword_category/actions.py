from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import KeywordCategory


class KeywordCategoryActions:
    def __init__(self, keyword_category: "KeywordCategory") -> None:
        self.keyword_category = keyword_category
