from typing import Any, Literal

from sentry_sdk import capture_exception, capture_message, push_scope

MessageLevel = Literal["fatal", "error", "warning", "log", "info", "debug"]


class SentryLogger:
    @staticmethod
    def log_message(message: str, details: str | dict[str, Any] | None = None, level: MessageLevel = "info"):
        with push_scope() as scope:
            if details:
                scope.set_extra("details", details)
            capture_message(message, level=level)

    @staticmethod
    def log_exception(err: Exception, details: str, **extra):
        with push_scope() as scope:
            scope.set_extra("details", details)

            for key, value in extra.items():
                scope.set_extra(key, value)

            capture_exception(err)
