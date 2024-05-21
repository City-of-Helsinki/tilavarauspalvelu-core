import os

# Makes sure `Local` environment settings are enabled by default.
os.environ.setdefault("DJANGO_SETTINGS_ENVIRONMENT", "Local")


class LocalMixin:
    """Add custom local settings here."""


class AutomatedTestMixin:
    """Add custom automated test settings here."""
