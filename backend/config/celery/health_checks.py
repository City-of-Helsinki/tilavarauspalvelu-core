from __future__ import annotations

from pathlib import Path
from typing import Any

__all__ = [
    "create_health_check_file",
    "remove_health_check_file",
]


HEALTH_CHECK_FILE = Path("/tmp/celery_heartbeat")  # noqa: S108  # nosec  # NOSONAR


def create_health_check_file(**kwargs: Any) -> None:
    # Create the file to indicate that the beat is alive.
    HEALTH_CHECK_FILE.touch(exist_ok=True)


# No signal exists for this beat shutdown
def remove_health_check_file(**kwargs: Any) -> None:
    # Remove the file to indicate that the worker has crashed.
    HEALTH_CHECK_FILE.unlink(missing_ok=True)
