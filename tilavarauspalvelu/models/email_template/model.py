from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

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

    objects = EmailTemplateManager()

    # Translated field hints
    subject_fi: str | None
    subject_en: str | None
    subject_sv: str | None

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

    @property
    def text_template_path(self) -> str:
        return f"email/text/{self.type}.jinja"

    @property
    def html_template_path(self) -> str:
        return f"email/html/{self.type}.jinja"
