from __future__ import annotations

import re

import pytest
from django.urls import reverse

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory, UserFactory

pytestmark = [
    pytest.mark.django_db,
]


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
