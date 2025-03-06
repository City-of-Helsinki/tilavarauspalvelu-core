from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Organisation


__all__ = [
    "OrganisationValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class OrganisationValidator:
    organisation: Organisation
