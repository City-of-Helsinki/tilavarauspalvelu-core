from __future__ import annotations

from typing import TYPE_CHECKING

from auditlog.registry import auditlog
from django.conf import settings

if TYPE_CHECKING:
    from django.db.models.base import ModelBase


class AuditLogger:
    # Registers model for audit logging if audit logging is enabled
    @staticmethod
    def register(model: ModelBase, *, exclude_fields: list[str] | None = None) -> None:
        if settings.AUDIT_LOGGING_ENABLED:
            auditlog.register(model, exclude_fields=exclude_fields)
