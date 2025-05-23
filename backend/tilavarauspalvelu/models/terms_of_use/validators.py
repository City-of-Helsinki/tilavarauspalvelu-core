from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TermsOfUse


__all__ = [
    "TermsOfUseValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TermsOfUseValidator:
    terms_of_use: TermsOfUse
