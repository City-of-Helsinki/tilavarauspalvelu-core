import pytest


@pytest.fixture(autouse=True)
def _disable_elasticsearch(settings):
    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = False
