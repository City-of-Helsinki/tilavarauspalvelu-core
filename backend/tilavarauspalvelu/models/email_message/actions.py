from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from tilavarauspalvelu.integrations.email.typing import EmailData

if TYPE_CHECKING:
    from .model import EmailMessage


__all__ = [
    "EmailMessageActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class EmailMessageActions:
    email_message: EmailMessage

    def to_email_data(self) -> EmailData:
        return EmailData(
            recipients=list(self.email_message.recipients),
            subject=self.email_message.subject,
            text_content=self.email_message.text_content,
            html_content=self.email_message.html_content,
            valid_until=self.email_message.valid_until,
            attachments=list(self.email_message.attachments),
            created_at=self.email_message.created_at,
        )
