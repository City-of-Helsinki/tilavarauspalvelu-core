import pytest


@pytest.fixture(autouse=True)
def enable_hauki_admin_ui(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "test-tvp"
    settings.HAUKI_SECRET = "super_secret"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = "parent-organisation"
    settings.HAUKI_ADMIN_UI_URL = "http://test.com/admin"
