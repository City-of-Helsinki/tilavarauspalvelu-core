from auditlog.registry import auditlog
from django.conf import settings
from django.db.models.base import Model


class AuditLogger(object):

    # Registers model for audit logging if audit logging is enabled
    @staticmethod
    def register(model: Model):
        if settings.AUDIT_LOGGING_ENABLED:
            auditlog.register(model)
