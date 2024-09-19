from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import EmailType

from .queryset import EmailTemplateManager

if TYPE_CHECKING:
    from .actions import EmailTemplateActions


class EmailTemplate(models.Model):
    type: EmailType = models.CharField(
        max_length=254,
        choices=EmailType.choices,
        unique=True,
        blank=False,
        null=False,
        verbose_name=_("Email type"),
        help_text=_("Only one template per type can be created."),
    )
    name: str = models.CharField(
        max_length=255,
        unique=True,
        verbose_name=_("Unique name for this content"),
        null=False,
        blank=False,
    )

    subject: str = models.CharField(max_length=255, null=False, blank=False)
    content: str = models.TextField(
        verbose_name=_("Content"),
        help_text=_("Email body content. Use curly brackets to indicate data specific fields e.g {{reservee_name}}."),
        null=False,
        blank=False,
    )

    html_content: str | None = models.FileField(
        verbose_name=_("HTML content"),
        help_text=_(
            "Email body content as HTML. Use curly brackets to indicate data specific fields e.g {{reservee_name}}."
        ),
        null=True,
        blank=True,
        upload_to=settings.EMAIL_HTML_TEMPLATES_ROOT,
    )

    objects = EmailTemplateManager()

    # Translated field hints
    subject_fi: str | None
    subject_en: str | None
    subject_sv: str | None
    content_fi: str | None
    content_en: str | None
    content_sv: str | None
    html_content_fi: str | None
    html_content_en: str | None
    html_content_sv: str | None

    class Meta:
        db_table = "email_template"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        choices = dict(EmailType.choices)
        label = choices.get(self.type) or self.type
        return f"{label}: {self.name}"

    @cached_property
    def actions(self) -> EmailTemplateActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import EmailTemplateActions

        return EmailTemplateActions(self)
