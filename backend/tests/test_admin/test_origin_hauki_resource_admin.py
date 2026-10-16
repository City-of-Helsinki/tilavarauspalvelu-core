from __future__ import annotations

import re

import pytest
from django.urls import reverse

from tilavarauspalvelu.constants import NEVER_ANY_OPENING_HOURS_HASH

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]

NEVER_ANY_OPENING_HOURS_NOTE = "OriginHaukiResources with this specific hash never have any opening hours."


# ── Linked reservation units ──


def test_origin_hauki_resource_admin__changelist__linked_reservation_names_fall_back_to_other_languages(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create()
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi="Sauna", name_en="Sauna", name_sv="Bastu")
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi=None, name_en="Cottage", name_sv=None)
    ReservationUnitFactory.create(origin_hauki_resource=resource, name_fi=None, name_en=None, name_sv=None)
    url = reverse("admin:tilavarauspalvelu_originhaukiresource_changelist")

    response = api_client.get(url)

    assert response.status_code == 200

    linked_reservation_units = re.findall(
        r'<td class="field-linked_reservation_units">(.*?)</td>',
        response.content.decode(),
    )
    assert linked_reservation_units == ["Sauna, Cottage"]


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
