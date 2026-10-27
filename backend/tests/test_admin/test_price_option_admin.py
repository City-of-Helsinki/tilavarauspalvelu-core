from __future__ import annotations

import datetime
from typing import Any

import pytest
from django.urls import reverse

from tilavarauspalvelu.models import PriceOption

from tests.factories import (
    ApplicationRoundFactory,
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.test_admin.helpers import collect_admin_form_errors

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2027, 1, 1)


# ── Helpers ──


def option_form_data(*, name: str, unit_group_pk: int, is_active: bool) -> dict[str, Any]:
    data = {
        "name_fi": name,
        "name_en": "",
        "name_sv": "",
        "description_fi": "",
        "description_en": "",
        "description_sv": "",
        "unit_group": unit_group_pk,
    }
    if is_active:
        data["is_active"] = "on"
    return data


def create_unit_using(pricing_group):
    row = ReservationUnitPricingGroupFactory.create(pricing_group=pricing_group, begins=JAN_1)
    return row.reservation_unit


def create_round(reservation_units):
    return ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=reservation_units,
        application_period_begins_at=datetime.datetime(2027, 1, 1, tzinfo=datetime.UTC),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
    )


# ── Application rounds ──


def test_price_option_admin__new_option_for_round_with_only_implicit_options(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=None, valid_from=JAN_1)
    create_round([create_unit_using(pricing_group)])

    url = reverse("admin:tilavarauspalvelu_priceoption_add")
    data = option_form_data(name="Juniors", unit_group_pk=unit_group.pk, is_active=True)
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    assert PriceOption.objects.filter(name_fi="Juniors").exists()


def test_price_option_admin__new_option_that_makes_round_inconsistent_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")

    explicit_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=explicit_group, price_option=adults, valid_from=JAN_1)
    implicit_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=implicit_group, price_option=None, valid_from=JAN_1)

    explicit_unit = create_unit_using(explicit_group)
    implicit_unit = create_unit_using(implicit_group)
    create_round([explicit_unit, implicit_unit])

    url = reverse("admin:tilavarauspalvelu_priceoption_add")
    data = option_form_data(name="Juniors", unit_group_pk=unit_group.pk, is_active=True)

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                f"Application round 'Kesä': Reservation unit {implicit_unit.pk} has price options "
                f"'Adults', 'Juniors' on 2027-05-01, but reservation unit {explicit_unit.pk} has 'Adults' "
                f"on 2027-05-01. All reservation units must have the same price options for the whole "
                f"reservation period."
            ),
        },
    ]
    assert not PriceOption.objects.filter(name_fi="Juniors").exists()


def test_price_option_admin__deactivating_implicit_option_of_round_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=None, valid_from=JAN_1)
    create_round([create_unit_using(pricing_group)])

    url = reverse("admin:tilavarauspalvelu_priceoption_change", args=[adults.pk])
    data = option_form_data(name="Adults", unit_group_pk=unit_group.pk, is_active=False)

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                "Application round 'Kesä': The change removes price options 'Adults' from the application round. "
                "Applicants can select them until the reservations of the round are made."
            ),
        },
    ]
    adults.refresh_from_db()
    assert adults.is_active is True
