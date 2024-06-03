import os

# Makes sure `Local` environment settings are enabled by default.
os.environ.setdefault("DJANGO_SETTINGS_ENVIRONMENT", "Local")


class LocalMixin:
    """Add custom local settings here."""

    SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = ["localhost:3000", "localhost:3001"]
    CELERY_TASK_ALWAYS_EAGER = True


class DockerMixin:
    """Add custom docker settings here."""


class AutomatedTestMixin:
    """Add custom automated test settings here."""
