from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.contrib.postgres.fields import ArrayField, HStoreField
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.validators import validate_email_attachments
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.typing import EmailAttachment

    from .actions import EmailMessageActions
    from .queryset import EmailMessageManager
    from .validators import EmailMessageValidator


__all__ = [
    "EmailMessage",
]


class EmailMessage(models.Model):
    """Stores an email message that could not be sent at the time of creation."""

    subject: str = models.TextField()
    recipients: list[str] = ArrayField(base_field=models.EmailField())

    text_content: str = models.TextField()
    html_content: str = models.TextField()

    attachments: list[EmailAttachment] = ArrayField(
        base_field=HStoreField(),
        blank=True,
        default=list,
        validators=[validate_email_attachments],
    )

    valid_until: datetime.datetime = models.DateTimeField(db_index=True)

    created_at: datetime.datetime = models.DateTimeField(blank=True, default=local_datetime, db_index=True)

    objects: ClassVar[EmailMessageManager] = LazyModelManager.new()
    actions: EmailMessageActions = LazyModelAttribute.new()
    validators: EmailMessageValidator = LazyModelAttribute.new()

    class Meta:
        verbose_name = _("email message")
        verbose_name_plural = _("email messages")
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.subject
