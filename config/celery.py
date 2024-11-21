from __future__ import annotations

import logging
import os
import sys
import time
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path
from typing import TYPE_CHECKING, Any

from celery import Celery, bootsteps
from celery.app.log import Logging

if TYPE_CHECKING:
    from celery.worker import WorkController
    from kombu.asynchronous.timer import Entry, Timer

# Set the default Django settings module for the 'celery' app.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


class LivenessProbe(bootsteps.StartStopStep):
    """
    Liveness probe for the worker.
    This works by waking up the worker on a timer to check active tasks and creating a heartbeat file.

    See: https://docs.celeryq.dev/en/stable/userguide/extending.html#example-worker-bootstep
    Adapted from: https://github.com/celery/celery/issues/4079#issuecomment-1128954283
    """

    requires = {"celery.worker.components:Timer"}

    def __init__(self, worker: WorkController, **worker_arguments: Any) -> None:
        self.schedule_entry: Entry | None = None

        # If this file exists, the worker is alive.
        # If it doesn't exist, the worker has crashed.
        self.health_check_file = Path("/tmp/worker_heartbeat")  # noqa: S108  # nosec  # NOSONAR

        # How often to check the liveness of the worker.
        self.period_seconds = 10.0

        # How long accepted tasks are allowed to be in the workers task queue
        # before the worker should be considered to be in deadlock.
        self.request_max_age = 300.0  # 5 minutes

        super().__init__(worker, **worker_arguments)

    def start(self, worker: WorkController) -> None:
        """Called when the worker is started."""
        timer: Timer = worker.timer  # type: ignore
        self.schedule_entry = timer.call_repeatedly(
            secs=self.period_seconds,
            fun=self.health_check,
            args=(worker,),
            priority=10,  # Run before other tasks.
        )

    def stop(self, worker: WorkController) -> None:  # noqa: ARG002
        """Called when the worker shuts down."""
        # Cancel the timer.
        if self.schedule_entry is not None:
            self.schedule_entry.cancel()
            self.schedule_entry = None

        # Remove the file to indicate that the worker has crashed.
        self.health_check_file.unlink(missing_ok=True)

    def health_check(self, worker: WorkController) -> None:
        """
        Check that the worker is not in a deadlock, meaning it's stuck processing some a task
        while it has active requests that are older than the accepted maximum age for a request.
        """
        for request in worker.state.active_requests:
            if request.time_start is not None and time.time() - request.time_start > self.request_max_age:
                msg = (
                    f"Detecting worker '{worker.hostname}' is in a deadlock, since "
                    f"it has an active request for task '{request.name}' older than "
                    f"{self.request_max_age} seconds. Destroying worker."
                )
                raise SystemExit(msg)

        # Create the file to indicate that the worker is alive.
        self.health_check_file.touch(exist_ok=True)


class RotatingCeleryLogging(Logging):
    def _detect_handler(self, logfile: str | None = None) -> logging.StreamHandler | TimedRotatingFileHandler:
        logfile = sys.__stderr__ if logfile is None else logfile
        if hasattr(logfile, "write"):
            return logging.StreamHandler(logfile)

        # Modify default file logging handler to the rotating file handler
        # to avoid log file growing too large. Keep 12 hourly backups.
        return TimedRotatingFileHandler(logfile, interval=1, when="h", backupCount=12, encoding="utf-8")


# Create the Celery app.
app = Celery("tilavarauspalvelu", log=RotatingCeleryLogging)

# Add the liveness probe to the worker in platta environments.
if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") in ("Development", "Testing", "Staging", "Production"):
    app.steps["worker"].add(LivenessProbe)

# Add default configuration for Celery.
app.conf.update({"broker_url": os.getenv("CELERY_BROKER_URL", "filesystem://"), "broker_transport_options": {}})

# All celery-related configuration keys should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
