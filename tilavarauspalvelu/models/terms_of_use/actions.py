from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TermsOfUse


__all__ = [
    "TermsOfUseActions",
]


class TermsOfUseActions:
    def __init__(self, terms_of_use: TermsOfUse) -> None:
        self.terms_of_use = terms_of_use
