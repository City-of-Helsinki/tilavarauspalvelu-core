import datetime
from typing import TYPE_CHECKING

import pytest
from django.contrib import admin
from django.test import Client, override_settings
from django.urls import reverse

from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.models import RequestLog, Reservation, SQLLog
from tilavarauspalvelu.tasks import create_or_update_reservation_statistics
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

from tests import factories
from tests.helpers import patch_method
from tests.mocks import MockResponse
from tests.test_external_services.test_verkkokauppa.test_merchant_requests import get_merchant_response

if TYPE_CHECKING:
    from django.urls import URLPattern

    from tests.factories._base import GenericDjangoModelFactory


@pytest.fixture
def create_all_models():
    """Create a model instance for each factory in tests.factories."""
    for factory_name in factories.__all__:
        model_factory: GenericDjangoModelFactory = getattr(factories, factory_name)

        if model_factory is factories.ReservableTimeSpanFactory:
            model_factory.create(
                start_datetime=datetime.datetime(2024, 1, 1, 12),
                end_datetime=datetime.datetime(2024, 1, 1, 22),
            )
        else:
            model_factory.create()

        request_log = RequestLog.objects.create(path="foo", body="bar", duration_ms=123)
        SQLLog.objects.create(
            request_log=request_log,
            sql="SELECT * FROM foo",
            succeeded=True,
            duration_ns=123,
            stack_info="stack_info",
        )

        create_or_update_reservation_statistics(Reservation.objects.values_list("pk", flat=True))


@pytest.mark.django_db
# Override languages, since TinyMCE can't handle lazy language name translations in tests ¯\_(ツ)_/¯
@override_settings(LANGUAGES=[("fi", "Finnish"), ("en", "English"), ("sv", "Swedish")])
@pytest.mark.slow
@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=200, json=get_merchant_response))
def test_django_admin_site__pages_load__model_admins(create_all_models):
    """Test that all Django admin pages load without errors."""
    user = factories.UserFactory.create_superuser()
    client = Client()
    client.force_login(user)

    # Loop over all models that are registered to the admin site
    for model, model_admin in admin.site._registry.items():
        # Only test models from tilavarauspalvelu app
        if model._meta.app_label != "tilavarauspalvelu":
            continue

        url_pattern: URLPattern
        for url_pattern in model_admin.urls:
            # List & Add new views
            if url_pattern.lookup_str.endswith((".changelist_view", ".add_view")):
                admin_url = reverse(f"admin:{url_pattern.name}")

                assert client.get(admin_url).status_code == 200, admin_url

            # Edit & Delete views
            elif url_pattern.lookup_str.endswith((".change_view", ".delete_view")):
                first_object = model.objects.first()
                admin_url = reverse(f"admin:{url_pattern.name}", args=[first_object.pk])

                assert client.get(admin_url).status_code == 200, admin_url

            # Skipped views
            elif (
                # History & Redirect to Edit view
                url_pattern.lookup_str.endswith((".history_view", ".RedirectView"))
                # Custom views
                or url_pattern.lookup_str.startswith(
                    (
                        "adminsortable2.",  # Updating the rank field order when moving instances in the list view
                        "admin_extra_buttons.",  # Custom admin views
                        "import_export.",  # Import/export views
                    )
                )
            ):
                continue
            else:
                pytest.fail(f"Unknown lookup_str = {url_pattern}")


@pytest.mark.django_db
@pytest.mark.slow
def test_django_admin_site__pages_load__data_views():
    """Test that all Django Admin data views load"""
    user = factories.UserFactory.create_superuser()
    client = Client()
    client.force_login(user)

    url_pattern: URLPattern
    for url_pattern in admin.site.get_admin_data_urls():
        # Views that we don't really want to test
        if url_pattern.lookup_str.endswith(
            (
                ".download_json",  # Doesn't accept GET requests
                ".download_csv",  # Doesn't accept GET requests
                ".text_search_list_view",  # Does not work with LocMemCache
                "_redirect_view",
            )
        ):
            continue

        # Handle views that take arguments
        if url_pattern.pattern.converters:
            converter = next(iter(url_pattern.pattern.converters))
            if converter == "email_type":
                # Test with all email types
                for email_type in EmailType:
                    admin_url = reverse(f"admin:{url_pattern.name}", args=[email_type.value])
                    assert client.get(admin_url).status_code == 200, admin_url
            else:
                msg = f"Unknown converter = {converter}"
                raise pytest.fail(msg)

        # Views that don't take arguments
        else:
            admin_url = reverse(f"admin:{url_pattern.name}")

            assert client.get(admin_url).status_code == 200, admin_url
