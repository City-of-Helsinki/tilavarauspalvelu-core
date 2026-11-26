from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from django.db import connection
from django.db.utils import OperationalError
from rest_framework.reverse import reverse

if TYPE_CHECKING:
    from pytest_django import Settings
    from rest_framework.test import APIClient

pytestmark = [
    pytest.mark.django_db,
]


# ── Liveness ──


def test_liveness_check__returns_status_and_version(api_client: APIClient, settings: Settings) -> None:
    settings.APP_VERSION = "v1.2.3"

    response = api_client.get(reverse("liveness_check"))

    assert response.status_code == 200
    assert response.json() == {"status": "RUNNING", "version": "v1.2.3"}


# ── Readiness ──


def test_readiness_check__returns_status_and_version(api_client: APIClient, settings: Settings) -> None:
    settings.APP_VERSION = "v1.2.3"

    response = api_client.get(reverse("readiness_check"))

    assert response.status_code == 200
    assert response.json() == {"status": "READY", "version": "v1.2.3"}


def test_readiness_check__returns_version_when_database_is_not_ready(api_client: APIClient, settings: Settings) -> None:
    settings.APP_VERSION = "v1.2.3"

    with patch.object(connection, "ensure_connection", side_effect=OperationalError("no database")):
        response = api_client.get(reverse("readiness_check"))

    assert response.status_code == 503
    assert response.json() == {"status": "NOT_READY", "version": "v1.2.3", "error": "no database"}
