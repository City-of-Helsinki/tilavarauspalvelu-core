from tilavarauspalvelu.celery import app

from .pruning import prune_reservations

# The pruning task will be run periodically at every PRUNE_INTERVAL_SECONDS
PRUNE_INTERVAL_SECONDS = 60 * 10

# Reservations older than PRUNE_OLDER_THAN_MINUTES will be deleted when the task is run
PRUNE_OLDER_THAN_MINUTES = 20


@app.task
def _prune_reservations() -> None:
    prune_reservations(PRUNE_OLDER_THAN_MINUTES)


@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs) -> None:
    sender.add_periodic_task(PRUNE_INTERVAL_SECONDS, _prune_reservations.s())
