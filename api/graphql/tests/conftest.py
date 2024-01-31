import pytest


@pytest.fixture(autouse=True)
def _disable_elasticsearch(settings):
    """
    Disable Elasticsearch for the duration of the tests to make them run faster.

    Even though Elasticsearch is disabled for all tests, the tests using Elasticsearch still seem to be working.
    """
    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = False
