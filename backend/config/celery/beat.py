from __future__ import annotations

from celery.signals import beat_init
from django_celery_beat import schedulers

from .health_checks import create_health_check_file, remove_health_check_file

__all__ = [
    "VaraamoDatabaseScheduler",
]


# This is connected using entrypoints, see `pyproject.toml`: [project.entry-points."celery.beat_schedulers"]
class VaraamoDatabaseScheduler(schedulers.DatabaseScheduler):
    """Extend the DatabaseScheduler to remove the 'HEALTH_CHECK_FILE' when beat is shut down."""

    def close(self) -> None:
        # No signal exists for this beat shutdown so we need to override the scheduler to add it.
        remove_health_check_file()
        super().close()


# Connect signals
beat_init.connect(create_health_check_file)
