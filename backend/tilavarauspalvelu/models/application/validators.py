from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application


__all__ = [
    "ApplicationValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationValidator:
    application: Application
