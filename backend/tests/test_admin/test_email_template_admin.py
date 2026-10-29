from __future__ import annotations

import pytest
from admin_data_views.settings import admin_data_settings
from django.urls import reverse

from tests.factories import UserFactory

pytestmark = [
    pytest.mark.django_db,
]


# ── Email template view ──


def test_email_template_admin__view__invalid_email_type(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    url = reverse(
        "admin:view_email_type",
        kwargs={"email_type": "not_an_email_type"},
        current_app=admin_data_settings.NAME,
    )
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.content.decode() == "Invalid email type"


# ── Email tester ──


def test_email_template_admin__tester__invalid_email_type(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    url = reverse(
        "admin:email_tester",
        kwargs={"email_type": "not_an_email_type"},
        current_app=admin_data_settings.NAME,
    )
    response = api_client.get(url)

    assert response.status_code == 400
    assert response.content.decode() == "Invalid email type: not_an_email_type"
