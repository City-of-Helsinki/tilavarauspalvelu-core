from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import EmailMessage

__all__ = [
    "EmailMessageAdmin",
]

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest


@admin.register(EmailMessage)
class EmailMessageAdmin(admin.ModelAdmin):
    # List
    list_display = [
        "subject",
        "valid_until",
        "created_at",
    ]

    # Form
    fieldsets = [
        [
            _("Basic information"),
            {
                "fields": [
                    "subject",
                    "recipients",
                    "valid_until",
                    "created_at",
                ],
            },
        ],
        [
            _("Content"),
            {
                "fields": [
                    "text_content",
                    "html_content",
                ],
            },
        ],
        [
            _("Attachments"),
            {
                "fields": [
                    "attachments",
                ],
            },
        ],
    ]

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_delete_permission(self, request: WSGIRequest, obj: EmailMessage | None = None) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: EmailMessage | None = None) -> bool:
        return False
