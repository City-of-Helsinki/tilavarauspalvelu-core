from collections.abc import Callable
from functools import wraps
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

    @staticmethod
    def log_if_raises(details: str, *, re_raise: bool = False):
        """
        Decorator that logs exceptions raised by the decorated function.
        Note that the decorated function should return None.

        :param details: A string describing the context of the exception.
        :param re_raise: Whether to re-raise the exception after logging.
        """

        def decorator[**P](func: Callable[P, None]) -> Callable[P, None]:
            @wraps(func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> None:
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    SentryLogger.log_exception(err, details)
                    if re_raise:
                        raise

            return wrapper

        return decorator
