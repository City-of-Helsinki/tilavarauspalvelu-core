from __future__ import annotations

import pytest
from django.urls import reverse

from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH

from tests.factories import OriginHaukiResourceFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]

NEVER_ANY_OPENING_HOURS_NOTE = "OriginHaukiResources with this specific hash never have any opening hours."


# ── Opening hours hash help text ──


def test_origin_hauki_resource_admin__never_any_opening_hours_note__shown_once(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create(opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH)
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[resource.pk])

    api_client.get(url)
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.content.decode().count(NEVER_ANY_OPENING_HOURS_NOTE) == 1


def test_origin_hauki_resource_admin__never_any_opening_hours_note__not_shown_for_other_hashes(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    never_resource = OriginHaukiResourceFactory.create(opening_hours_hash=NEVER_ANY_OPENING_HOURS_HASH)
    never_url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[never_resource.pk])
    api_client.get(never_url)

    resource = OriginHaukiResourceFactory.create(opening_hours_hash="abc123")
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_change", args=[resource.pk])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response.content.decode().count(NEVER_ANY_OPENING_HOURS_NOTE) == 0
