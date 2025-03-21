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
