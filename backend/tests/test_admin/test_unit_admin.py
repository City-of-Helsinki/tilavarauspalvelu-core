from __future__ import annotations

import pytest
from django.urls import reverse

from tests.factories import UnitFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── TPREK fields ──


def test_unit_admin__change_page__tprek_fields_read_only_for_tprek_unit(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    unit = UnitFactory.create(tprek_id="1234")

    response = api_client.get(reverse("admin:tilavarauspalvelu_unit_change", args=[unit.pk]))

    assert response.status_code == 200

    form_fields = response.context["adminform"].form.fields
    assert "name_fi" not in form_fields
    assert "description_fi" not in form_fields
    assert "address_street_fi" not in form_fields
    assert "coordinates" not in form_fields
    assert "description_en" in form_fields
    assert "description_sv" in form_fields
    assert "tprek_id" in form_fields
    assert "payment_merchant" in form_fields


def test_unit_admin__change_page__tprek_fields_editable_without_tprek_id(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    unit = UnitFactory.create(tprek_id=None)

    response = api_client.get(reverse("admin:tilavarauspalvelu_unit_change", args=[unit.pk]))

    assert response.status_code == 200

    form_fields = response.context["adminform"].form.fields
    assert "name_fi" in form_fields
    assert "description_fi" in form_fields
    assert "address_street_fi" in form_fields
    assert "coordinates" in form_fields
