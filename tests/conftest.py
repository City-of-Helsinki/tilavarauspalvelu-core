from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from rest_framework.test import APIClient

from tests.helpers import GraphQLClient, patch_method
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from django.core.mail import EmailMessage


@pytest.fixture
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture(autouse=False)
def _sentry_require_mocking(request):
    """Raise an error if SentryHelper methods are used but not mocked during the test."""
    with patch_method(SentryLogger.log_exception), patch_method(SentryLogger.log_message):
        SentryLogger.log_exception.side_effect = Exception("SentryLogger.log_exception was not mocked")
        SentryLogger.log_message.side_effect = Exception("SentryLogger.log_message was not mocked")
        yield


@pytest.fixture(autouse=True)
def _enable_elasticsearch(request, settings):
    """Enable syncing to Elasticsearch for the duration of the test."""
    use_elasticsearch = "enable_elasticsearch" in request.keywords

    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = use_elasticsearch


@pytest.fixture
def outbox() -> list[EmailMessage]:
    from django.core import mail

    return mail.outbox
