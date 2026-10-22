from __future__ import annotations

from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit
from tilavarauspalvelu.models import PriceComponent, PricingGroup, ReservationUnitPricingGroup
from tilavarauspalvelu.typing import error_codes

from tests.factories import ReservationUnitFactory, UserFactory
from tests.test_admin.helpers import collect_admin_form_errors, management_form_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def component_form_data(index: int, *, valid_from: str, valid_until: str = "") -> dict[str, Any]:
    return {
        f"components-{index}-kind": PriceComponentKind.BASE.value,
        f"components-{index}-valid_from": valid_from,
        f"components-{index}-valid_until": valid_until,
        f"components-{index}-amount": "10.00",
        f"components-{index}-price_unit": PriceUnit.PER_HOUR.value,
        f"components-{index}-payment_type": PaymentType.ONLINE.value,
        f"components-{index}-material_price_description_fi": "",
        f"components-{index}-material_price_description_en": "",
        f"components-{index}-material_price_description_sv": "",
    }


def group_form_data() -> dict[str, Any]:
    return {
        "name_fi": "Hinnasto",
        "name_en": "Prices",
        "name_sv": "Priser",
    }


def test_pricing_group_admin__create_with_component_and_reservation_unit(api_client):
    api_client.force_login(UserFactory.create_superuser())
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        "reservation_units-0-reservation_unit": reservation_unit.pk,
        "reservation_units-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_units", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    pricing_group = PricingGroup.objects.get(name_fi="Hinnasto")
    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert len(components) == 1
    assert components[0].amount == Decimal(10)
    rows = list(ReservationUnitPricingGroup.objects.filter(pricing_group=pricing_group))
    assert len(rows) == 1
    assert rows[0].reservation_unit == reservation_unit


def test_pricing_group_admin__overlapping_components_are_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        **component_form_data(1, valid_from="2026-02-01"),
        **management_form_data("components", total_forms=2),
        **management_form_data("reservation_units", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": "Pricing group has more than one price from 2026-02-01 onward.",
        },
    ]
    assert not PricingGroup.objects.exists()


def test_pricing_group_admin__reservation_unit_before_components_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    reservation_unit = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-02-01"),
        "reservation_units-0-reservation_unit": reservation_unit.pk,
        "reservation_units-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_units", total_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                "A reservation unit uses the pricing group from 2026-01-01, but its prices begin on 2026-02-01."
            ),
        },
    ]
    assert not PricingGroup.objects.exists()


def test_pricing_group_admin__own_group_with_two_reservation_units_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    first = ReservationUnitFactory.create()
    second = ReservationUnitFactory.create()

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        "reservation_units-0-reservation_unit": first.pk,
        "reservation_units-0-begins": "2026-01-01",
        "reservation_units-1-reservation_unit": second.pk,
        "reservation_units-1-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_units", total_forms=2),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": error_codes.PRICING_GROUP_OWN_GROUP_HAS_MANY_RESERVATION_UNITS,
            "message": "A pricing group without a unit group can be used by only one reservation unit.",
        },
    ]
    assert not PricingGroup.objects.exists()
