from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any

from celery import bootsteps
from celery.signals import worker_ready, worker_shutdown

from .health_checks import create_health_check_file, remove_health_check_file

if TYPE_CHECKING:
    from celery.worker import WorkController
    from kombu.asynchronous.timer import Entry, Timer


__all__ = [
    "LivenessProbe",
]


class LivenessProbe(bootsteps.StartStopStep):
    """
    Liveness probe for the worker.
    This works by waking up the worker on a timer to check active tasks and a heartbeat file.

    See: https://docs.celeryq.dev/en/stable/userguide/extending.html#example-worker-bootstep
    Adapted from: https://github.com/celery/celery/issues/4079#issuecomment-1128954283
    """

    requires = {"celery.worker.components:Timer"}

    def __init__(self, worker: WorkController, **worker_arguments: Any) -> None:
        self.schedule_entry: Entry | None = None

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

        remove_health_check_file()

    def health_check(self, worker: WorkController) -> None:
        """
        Check that the worker is not in a deadlock, meaning it's stuck processing some a task
        while it has active requests that are older than the accepted maximum age for a request.
        """
        for request in worker.state.active_requests:
            if request.time_start is not None and time.time() - request.time_start > self.request_max_age:
                remove_health_check_file()
                msg = (
                    f"Detecting worker '{worker.hostname}' is in a deadlock, since "
                    f"it has an active request for task '{request.name}' older than "
                    f"{self.request_max_age} seconds. Destroying worker."
                )
                raise SystemExit(msg)

        # Create the file to indicate that the worker is alive.
        create_health_check_file()


# Connect signals
worker_ready.connect(create_health_check_file)
worker_shutdown.connect(remove_health_check_file)
