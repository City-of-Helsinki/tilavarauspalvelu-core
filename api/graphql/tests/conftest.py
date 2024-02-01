import pytest


@pytest.fixture(autouse=True)
def _toggle_elasticsearch(request, settings):
    """Enable or disable syncing to Elasticsearch for the duration of the test."""
    use_elasticsearch = "elasticsearch" in request.keywords

    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = use_elasticsearch
