import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "tilavarauspalvelu.settings")

broker_url = os.getenv("CELERY_BROKER_URL", "filesystem://")
broker_options = os.getenv("CELERY_BROKER_TRANSPORT_OPTIONS", {})

app = Celery("tilavarauspalvelu")

app.conf.update({"broker_url": broker_url, "broker_transport_options": broker_options})

# All celery-related configuration keys
# should have a `CELERY_` prefix.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Load task modules from all registered Django apps.
app.autodiscover_tasks()
