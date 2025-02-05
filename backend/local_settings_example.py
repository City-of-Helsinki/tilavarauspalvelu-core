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


class DockerMixin:
    """Add custom docker settings here."""

    GRAPHQL_CODEGEN_ENABLED = False  # Set to True to enable codegen for frontend by disabling CSRF protection


class AutomatedTestMixin:
    """Add custom automated test settings here."""

    # Might be required depending on your database setup
    # DATABASES = values.DatabaseURLValue(default="postgis://localhost:5432/tvp")
