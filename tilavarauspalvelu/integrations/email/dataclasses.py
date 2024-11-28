from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import TYPE_CHECKING, Any, Self

from tilavarauspalvelu.integrations.email.rendering import render_html, render_text

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.enums import EmailType
    from tilavarauspalvelu.typing import EmailAttachment, EmailContext

__all__ = [
    "EmailData",
]


@dataclass
class EmailData:
    recipients: Iterable[str]
    subject: str
    text_content: str
    html_content: str
    attachments: Iterable[EmailAttachment] = ()

    @classmethod
    def build(
        cls,
        recipients: Iterable[str],
        context: EmailContext,
        email_type: EmailType,
        attachment: EmailAttachment = None,
    ) -> Self:
        """Helper method to build an EmailData object with the given context and email type."""
        return cls(
            recipients=list(recipients),
            subject=context["title"],
            text_content=render_text(email_type=email_type, context=context),
            html_content=render_html(email_type=email_type, context=context),
            attachments=[attachment] if attachment else [],
        )

    def __json__(self) -> dict[str, Any]:  # noqa: PLW3201
        """Make the object JSON serializable to be used in Celery tasks."""
        return asdict(self)
