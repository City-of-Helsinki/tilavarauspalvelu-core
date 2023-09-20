import pytest


@pytest.fixture(autouse=True)
def _setup_hauki_env_variables(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "origin"
    settings.HAUKI_SECRET = "HAUKISECRET"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = None
    settings.HAUKI_ADMIN_UI_URL = "https://test.com"
