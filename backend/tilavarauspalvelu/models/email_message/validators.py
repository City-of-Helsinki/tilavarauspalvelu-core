from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import EmailMessage


__all__ = [
    "EmailMessageValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class EmailMessageValidator:
    email_message: EmailMessage
