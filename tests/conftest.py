from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from rest_framework.test import APIClient

from tests.helpers import GraphQLClient

if TYPE_CHECKING:
    from django.core.mail import EmailMessage


@pytest.fixture()
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture(autouse=True)
def _enable_elasticsearch(request, settings):
    """Enable syncing to Elasticsearch for the duration of the test."""
    use_elasticsearch = "enable_elasticsearch" in request.keywords

    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = use_elasticsearch


@pytest.fixture(autouse=True)
def _enable_hierarchy_refresh(request, settings):
    """Enable refreshing the reservation unit hierarchy for the duration of the test."""
    use_elasticsearch = "enable_hierarchy_refresh" in request.keywords

    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = use_elasticsearch


@pytest.fixture()
def outbox() -> list[EmailMessage]:
    from django.core import mail

    return mail.outbox


@pytest.hookimpl()
def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption("--skip-elastic", action="store_true", default=False, help="Skip tests that need Elasticsearch.")
    parser.addoption("--skip-slow", action="store_true", default=False, help="Skip slow running tests.")


@pytest.hookimpl()
def pytest_collection_modifyitems(config, items):
    skip_slow = config.getoption("--skip-slow")
    skip_elastic = config.getoption("--skip-elastic")

    for item in items:
        if skip_slow and "slow" in item.keywords:
            item.add_marker(pytest.mark.skip(reason="Skipped due to --skip-slow option"))

        if "enable_elasticsearch" in item.keywords:
            # Enable Elasticsearch for this test
            item.add_marker(pytest.mark.xdist_group(name="enable_elasticsearch"))

            # Skip this test if --inelastic option was given
            if skip_elastic:
                item.add_marker(pytest.mark.skip(reason="Skipped due to --skip-elastic"))
