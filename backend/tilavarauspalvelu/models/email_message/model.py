from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.contrib.postgres.fields import ArrayField, HStoreField
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.validators import validate_email_attachments
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from .actions import EmailMessageActions
    from .queryset import EmailMessageManager
    from .validators import EmailMessageValidator


__all__ = [
    "EmailMessage",
]


class EmailMessage(models.Model):
    """Stores an email message that could not be sent at the time of creation."""

    subject = models.TextField()
    recipients = ArrayField(base_field=models.EmailField())

    text_content = models.TextField()
    html_content = models.TextField()

    attachments = ArrayField(
        base_field=HStoreField(),
        blank=True,
        default=list,
        validators=[validate_email_attachments],
    )

    valid_until = models.DateTimeField(db_index=True)

    created_at = models.DateTimeField(blank=True, default=local_datetime, db_index=True)

    objects: ClassVar[EmailMessageManager] = LazyModelManager.new()
    actions: LazyAttribute[EmailMessageActions] = LazyModelAttribute.new()
    validators: LazyAttribute[EmailMessageValidator] = LazyModelAttribute.new()

    class Meta:
        verbose_name = _("email message")
        verbose_name_plural = _("email messages")
        ordering = ["created_at"]

    def __str__(self) -> str:
        return self.subject
