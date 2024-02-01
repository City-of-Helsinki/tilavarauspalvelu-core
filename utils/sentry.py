from sentry_sdk import capture_exception, push_scope


def log_exception_to_sentry(err: Exception, details: str, **extra):
    with push_scope() as scope:
        scope.set_extra("details", details)

        for key, value in extra.items():
            scope.set_extra(key, value)

        capture_exception(err)
