import os
import sys
from logging import StreamHandler
from logging.handlers import TimedRotatingFileHandler

from celery import Celery
from celery.app.log import Logging

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tilavarauspalvelu.settings")

broker_url = os.getenv("CELERY_BROKER_URL", "filesystem://")
broker_options = os.getenv("CELERY_BROKER_TRANSPORT_OPTIONS", {})  # noqa: PLW1508


class RotatingCeleryLogging(Logging):
    def _detect_handler(self, logfile: str | None = None) -> StreamHandler | TimedRotatingFileHandler:
        logfile = sys.__stderr__ if logfile is None else logfile
        if hasattr(logfile, "write"):
            return StreamHandler(logfile)

        # Modify default file logging handler to the rotating file handler
        # to avoid log file growing too large. Keep 12 hourly backups.
        return TimedRotatingFileHandler(logfile, interval=1, when="h", backupCount=12, encoding="utf-8")


app = Celery("tilavarauspalvelu", log=RotatingCeleryLogging)

app.conf.update({"broker_url": broker_url, "broker_transport_options": broker_options})

# All celery-related configuration keys
# should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
