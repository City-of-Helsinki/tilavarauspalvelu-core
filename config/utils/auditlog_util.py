from auditlog.registry import auditlog
from django.conf import settings
from django.db.models.base import ModelBase


class AuditLogger:
    # Registers model for audit logging if audit logging is enabled
    @staticmethod
    def register(model: ModelBase) -> None:
        if settings.AUDIT_LOGGING_ENABLED:
            auditlog.register(model)
