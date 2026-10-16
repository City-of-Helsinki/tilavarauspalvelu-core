from __future__ import annotations

import re

import pytest
from django.contrib import admin
from django.urls import reverse

from tests.factories import UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Header ──


def test_admin_site__header__shows_environment_name(api_client, settings):
    settings.ENVIRONMENT_NAME = "production"

    user = UserFactory.create_superuser()
    api_client.force_login(user)

    response = api_client.get(reverse("admin:index"))

    assert response.status_code == 200

    content = response.content.decode()
    badge = re.search(r'<span class="app-environment[^"]*">[^<]*</span>', content)
    assert badge is not None
    assert badge.group() == '<span class="app-environment app-environment-production">production</span>'


# ── Model groups ──


def test_admin_site__index__every_model_is_in_a_topic_group(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    response = api_client.get(reverse("admin:index"))

    assert response.status_code == 200

    app_list = response.context["app_list"]
    group_labels = [app["app_label"] for app in app_list]
    assert group_labels == [
        "reservations",
        "reservation-units",
        "locations",
        "seasonal-bookings",
        "payments",
        "users-and-permissions",
        "content-and-emails",
        "system",
    ]

    shown_admin_urls = [model["admin_url"] for app in app_list for model in app["models"]]
    registered_admin_urls = [
        reverse(f"admin:{model._meta.app_label}_{model._meta.model_name}_changelist") for model in admin.site._registry
    ]
    assert sorted(set(shown_admin_urls)) == sorted(shown_admin_urls)
    assert set(registered_admin_urls) <= set(shown_admin_urls)


def test_admin_site__sidebar__uses_topic_groups(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    response = api_client.get(reverse("admin:tilavarauspalvelu_reservation_changelist"))

    assert response.status_code == 200

    group_labels = [app["app_label"] for app in response.context["available_apps"]]
    assert group_labels[0] == "reservations"


def test_admin_site__app_index__keeps_the_app_models(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    response = api_client.get(reverse("admin:app_list", args=["tilavarauspalvelu"]))

    assert response.status_code == 200

    app_labels = [app["app_label"] for app in response.context["app_list"]]
    assert app_labels == ["tilavarauspalvelu"]
