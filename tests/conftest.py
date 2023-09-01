from typing import ParamSpec, TypeVar

import pytest

from tests.helpers import GraphQLClient

T = TypeVar("T")
P = ParamSpec("P")


@pytest.fixture()
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture()
def disable_elasticsearch(settings):
    """Disable syncing to Elasticsearch for the duration of the test.
    Use with '@pytest.mark.usefixtures' decorator.
    """
    original = settings.SEARCH_SETTINGS["settings"]["auto_sync"]
    try:
        settings.SEARCH_SETTINGS["settings"]["auto_sync"] = False
        yield
    finally:
        settings.SEARCH_SETTINGS["settings"]["auto_sync"] = original
