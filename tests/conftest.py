from typing import ParamSpec, TypeVar

import pytest
from django.core.mail import EmailMessage
from rest_framework.test import APIClient

from tests.helpers import GraphQLClient

T = TypeVar("T")
P = ParamSpec("P")


@pytest.fixture()
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture()
def _disable_elasticsearch(settings):
    """
    Disable syncing to Elasticsearch for the duration of the test.
    Use with '@pytest.mark.usefixtures' decorator.
    """
    original = settings.SEARCH_SETTINGS["settings"]["auto_sync"]
    try:
        settings.SEARCH_SETTINGS["settings"]["auto_sync"] = False
        yield
    finally:
        settings.SEARCH_SETTINGS["settings"]["auto_sync"] = original


@pytest.fixture()
def outbox(settings) -> list[EmailMessage]:
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail

    return mail.outbox
