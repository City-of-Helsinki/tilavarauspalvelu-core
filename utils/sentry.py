from sentry_sdk import capture_exception, push_scope

# Available levels are "fatal", "error", "warning", "log", "info", and "debug".


class SentryLogger:
    @staticmethod
    def log_exception(err: Exception, details: str, **extra):
        with push_scope() as scope:
            scope.set_extra("details", details)

            for key, value in extra.items():
                scope.set_extra(key, value)

            capture_exception(err)
