import pytest
from django.core.mail import EmailMessage
from rest_framework.test import APIClient

from tests.helpers import GraphQLClient, capture_database_queries


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
def _disable_reservation_email_sending(settings):
    """
    Disable sending emails for the duration of the test.
    Use with '@pytest.mark.usefixtures' decorator.
    """
    # Trigger celery tasks synchronously, but don't send the reservation emails
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = False


@pytest.fixture()
def outbox(settings) -> list[EmailMessage]:
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    from django.core import mail

    return mail.outbox


@pytest.fixture()
def _disable_hauki_export(settings):
    settings.HAUKI_EXPORTS_ENABLED = None
