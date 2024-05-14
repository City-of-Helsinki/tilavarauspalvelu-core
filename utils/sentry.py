from collections.abc import Callable
from functools import wraps
from typing import Any, Literal

from sentry_sdk import capture_exception, capture_message, push_scope

LogLevelStr = Literal["fatal", "critical", "error", "warning", "info", "debug"]


class SentryLogger:
    @staticmethod
    def log_message(message: str, details: str | dict[str, Any] | None = None, level: LogLevelStr = "info"):
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
    def log_if_raises(details: str, *, catch: list[type[Exception]] | None = None, re_raise: bool = False):
        """
        Decorator that logs exceptions raised by the decorated function.
        Note that the decorated function should return None.

        :param details: A string describing the context of the exception.
        :param catch: A list of exceptions to catch. Catch all exceptions if not set.
        :param re_raise: Whether to re-raise the exception after logging.
        """

        def decorator[**P](func: Callable[P, None]) -> Callable[P, None]:
            @wraps(func)
            def wrapper(*args: P.args, **kwargs: P.kwargs) -> None:
                try:
                    return func(*args, **kwargs)
                except Exception as err:
                    # If catching specific errors, and the error is not in the list, re-raise it
                    if catch is not None and not any(isinstance(err, exception) for exception in catch):
                        raise

                    SentryLogger.log_exception(err, details)
                    if re_raise:
                        raise

            return wrapper

        return decorator
