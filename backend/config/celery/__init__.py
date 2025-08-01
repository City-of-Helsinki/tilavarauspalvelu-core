from __future__ import annotations

import os

from celery import Celery

from .worker import LivenessProbe

# Set the default Django settings module for the 'celery' app.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Create the Celery app.
app = Celery("tilavarauspalvelu")

# Add the liveness probe to the workers.
app.steps["worker"].add(LivenessProbe)

# All celery-related configuration keys should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


def remove_update_affecting_time_spans_tasks() -> None:
    try:
        active = app.control.inspect().active()
    except Exception:
        active = app.control.inspect().active()
    if active is None:
        return
    for worker_tasks in active.values():
        for task in worker_tasks:
            if task["name"] == "update_affecting_time_spans":
                app.control.revoke(task_id=task["id"], terminate=True)


def list_update_affecting_time_spans_tasks() -> None:
    try:
        active = app.control.inspect().active()
    except Exception:
        active = app.control.inspect().active()
    if active is None:
        return
    for worker_tasks in active.values():
        for task in worker_tasks:
            if task["name"] == "update_affecting_time_spans":
                pass


# select pg_terminate_backend(pid) from pg_stat_activity where datname='tilavarauspalveluprod' and state='active' and query='REFRESH MATERIALIZED VIEW CONCURRENTLY affecting_time_spans';
# select count(*) from pg_stat_activity where datname='tilavarauspalveluprod' and state='active' and query='REFRESH MATERIALIZED VIEW CONCURRENTLY affecting_time_spans';
