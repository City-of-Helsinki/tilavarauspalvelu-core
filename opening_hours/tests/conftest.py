import pytest
from django.conf import settings


@pytest.fixture(autouse=True)
def enable_hauki_admin_ui():
    settings.HAUKI_ORIGIN_ID = "test-tvp"
    settings.HAUKI_SECRET = "super_secret"
    settings.HAUKI_ORGANISATION_ID = "parent-organisation"
    settings.HAUKI_ADMIN_UI_URL = "http://test.com/admin"
