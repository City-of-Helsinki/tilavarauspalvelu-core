from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from auditlog.registry import auditlog
from django.conf import settings

if TYPE_CHECKING:
    from django.db.models.base import ModelBase


class AuditLogger:
    # The excluded fields of each registered model, also when audit logging is disabled.
    # Tests use these to turn on the audit log with the same options as in production.
    exclude_fields_by_model: ClassVar[dict[ModelBase, list[str] | None]] = {}

    # Registers model for audit logging if audit logging is enabled
    @staticmethod
    def register(model: ModelBase, *, exclude_fields: list[str] | None = None) -> None:
        AuditLogger.exclude_fields_by_model[model] = exclude_fields

        if settings.AUDIT_LOGGING_ENABLED:
            auditlog.register(model, exclude_fields=exclude_fields)
