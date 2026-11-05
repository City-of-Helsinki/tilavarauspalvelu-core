from __future__ import annotations

import pytest
from django.urls import reverse

from tests.factories import PriceComponentFactory, PriceOptionFactory, UnitGroupFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def option_form_data(unit_group_id: int) -> dict[str, str | int]:
    return {
        "name_fi": "Aikuiset",
        "name_en": "Adults",
        "name_sv": "Vuxna",
        "description_fi": "",
        "description_en": "",
        "description_sv": "",
        "unit_group": unit_group_id,
        "is_active": "on",
    }


def test_price_option_admin__unit_group_can_change_when_no_component_uses_option(api_client):
    api_client.force_login(UserFactory.create_superuser())
    option = PriceOptionFactory.create()
    new_unit_group = UnitGroupFactory.create()

    url = reverse("admin:tilavarauspalvelu_priceoption_change", args=[option.pk])
    response = api_client.post(path=url, data=option_form_data(new_unit_group.pk))

    assert response.status_code == 302, response.content
    option.refresh_from_db()
    assert option.unit_group == new_unit_group


def test_price_option_admin__unit_group_cannot_change_when_component_uses_option(api_client):
    api_client.force_login(UserFactory.create_superuser())
    option = PriceOptionFactory.create()
    old_unit_group = option.unit_group
    PriceComponentFactory.create(pricing_group__unit_group=old_unit_group, price_option=option)
    new_unit_group = UnitGroupFactory.create()

    url = reverse("admin:tilavarauspalvelu_priceoption_change", args=[option.pk])
    response = api_client.post(path=url, data=option_form_data(new_unit_group.pk))

    assert response.status_code == 302, response.content
    option.refresh_from_db()
    assert option.unit_group == old_unit_group
