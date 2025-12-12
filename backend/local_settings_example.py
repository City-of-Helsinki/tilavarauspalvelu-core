import os

# Makes sure `Local` environment settings are enabled by default.
os.environ.setdefault("DJANGO_SETTINGS_ENVIRONMENT", "Local")


class LocalMixin:
    """Add custom local settings here."""

    # On macOS, you might need to set these paths manually (https://gis.stackexchange.com/a/416882)
    # GDAL_LIBRARY_PATH = "/opt/homebrew/lib/libgdal.dylib"
    # GEOS_LIBRARY_PATH = "/opt/homebrew/lib/libgeos_c.dylib"

    # Required for allowing redirecting back to the frontend after login.
    SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = ["localhost:3000", "localhost:3001"]

    # CELERY_ENABLED = False  # If False, run tasks synchronously without a worker, but scheduled tasks will run.
    CELERY_TASK_ALWAYS_EAGER = True

    MOCK_VERKKOKAUPPA_API_ENABLED = True
    PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED = True
    VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 10000

    PINDORA_MOCK_ENABLED = True

    EMAIL_VARAAMO_EXT_LINK = "http://localhost:8000"
    EMAIL_FEEDBACK_EXT_LINK = "http://localhost:8000/feedback"

    PREFILL_RESERVATION_WITH_PROFILE_DATA = True


class DockerMixin:
    """Add custom docker settings here."""

    # Required for allowing redirecting back to the frontend after login.
    SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS = ["localhost:3000", "localhost:3001"]

    MOCK_VERKKOKAUPPA_API_ENABLED = True
    PINDORA_MOCK_ENABLED = True


class AutomatedTestMixin:
    """Add custom automated test settings here."""

    # Might be required depending on your database setup
    # DATABASES = values.DatabaseURLValue(default="postgis://localhost:5432/tvp")

    # On macOS, you might need to set these paths manually (https://gis.stackexchange.com/a/416882)
    # GDAL_LIBRARY_PATH = "/opt/homebrew/lib/libgdal.dylib"
    # GEOS_LIBRARY_PATH = "/opt/homebrew/lib/libgeos_c.dylib"
