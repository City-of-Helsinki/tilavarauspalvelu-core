from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import TermsOfUse


__all__ = [
    "TermsOfUseActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TermsOfUseActions:
    terms_of_use: TermsOfUse
