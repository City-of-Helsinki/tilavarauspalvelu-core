from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from rest_framework.test import APIClient

from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories._base import FakerEN, FakerFI, FakerSV
from tests.helpers import GraphQLClient, patch_method

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


@pytest.fixture
def outbox() -> list[EmailMessage]:
    from django.core import mail

    return mail.outbox


@pytest.fixture(autouse=True)
def _reset_faker_uniqueness():
    """Reset the uniqueness of all faker instances between tests so that they don't run out of unique values."""
    FakerFI.clear_unique()
    FakerSV.clear_unique()
    FakerEN.clear_unique()
