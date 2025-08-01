import logging
import traceback
from collections.abc import Generator
from types import TracebackType

from graphql import GraphQLError
from undine.hooks import LifecycleHook

logger = logging.getLogger(__name__)


class ExceptionTracebackHook(LifecycleHook):
    """Adds error tracebacks to GraphQL errors."""

    def run(self) -> Generator[None]:
        try:
            yield

        except GraphQLError as error:
            logger.exception("Error occurred")

            error.extensions.setdefault("traceback", self.get_traceback(error.__traceback__))
            raise

        except Exception as original_error:
            logger.exception("Unexpected error occurred")

            error = GraphQLError(str(original_error), original_error=original_error)
            error.extensions.setdefault("traceback", self.get_traceback(error.__traceback__))
            raise error from original_error

    def get_traceback(self, tb: TracebackType) -> list[str]:
        return [subline for line in traceback.format_tb(tb) for subline in line.split("\n")]
