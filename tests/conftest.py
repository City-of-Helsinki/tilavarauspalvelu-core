from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from rest_framework.test import APIClient

from tests.helpers import GraphQLClient, capture_database_queries

if TYPE_CHECKING:
    from django.core.mail import EmailMessage


@pytest.fixture()
def graphql() -> GraphQLClient:
    return GraphQLClient()


@pytest.fixture()
def query_counter(settings):
    settings.DEBUG = True
    return capture_database_queries


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture(autouse=True)
def _toggle_elasticsearch(request, settings):
    """Enable or disable syncing to Elasticsearch for the duration of the test."""
    use_elasticsearch = "elasticsearch" in request.keywords

    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = use_elasticsearch


@pytest.fixture()
def _disable_reservation_email_sending(settings):
    """
    Disable sending emails for the duration of the test.
    Use with '@pytest.mark.usefixtures' decorator.
    """
    # Trigger celery tasks synchronously, but don't send the reservation emails
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = False


@pytest.fixture()
def _in_memory_file_storage(settings):
    settings.STATICFILES_STORAGE = "django.core.files.storage.memory.InMemoryStorage"
    settings.DEFAULT_FILE_STORAGE = "django.core.files.storage.memory.InMemoryStorage"


@pytest.fixture()
def outbox(settings) -> list[EmailMessage]:
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail

    return mail.outbox


@pytest.fixture()
def _disable_hauki_export(settings):
    settings.HAUKI_EXPORTS_ENABLED = None


@pytest.fixture()
def _setup_hauki(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "origin"
    settings.HAUKI_SECRET = "HAUKISECRET"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = None
    settings.HAUKI_ADMIN_UI_URL = "https://test.com"


@pytest.fixture()
def _setup_verkkokauppa_env_variables(settings):
    settings.VERKKOKAUPPA_API_KEY = "test-api-key"
    settings.VERKKOKAUPPA_PRODUCT_API_URL = "http://test-product:1234"
    settings.VERKKOKAUPPA_ORDER_API_URL = "http://test-order:1234"
    settings.VERKKOKAUPPA_PAYMENT_API_URL = "http://test-payment:1234"
    settings.VERKKOKAUPPA_MERCHANT_API_URL = "http://test-merchant:1234"
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    settings.MOCK_VERKKOKAUPPA_API_ENABLED = False
    settings.MOCK_VERKKOKAUPPA_FRONTEND_URL = "http://mock-verkkokauppa.com"
    settings.MOCK_VERKKOKAUPPA_BACKEND_URL = "http://mock-verkkokauppa.com"


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

        if "elasticsearch" in item.keywords:
            # Enable Elasticsearch for this test
            item.add_marker(pytest.mark.xdist_group(name="elasticsearch"))

            # Skip this test if --noelastic option was given
            if skip_elastic:
                item.add_marker(pytest.mark.skip(reason="Skipped due to --skip-elastic"))
