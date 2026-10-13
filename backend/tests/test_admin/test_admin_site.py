from __future__ import annotations

import re

import pytest
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
