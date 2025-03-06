from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection


__all__ = [
    "ApplicationSectionValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationSectionValidator:
    application_section: ApplicationSection
