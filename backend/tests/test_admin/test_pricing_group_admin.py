from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

import pytest
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.enums import PriceComponentKind, PriceUnit
from tilavarauspalvelu.models import PriceComponent, PricingGroup, ReservationUnitPricingGroup
from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task
from tilavarauspalvelu.typing import error_codes

from tests.factories import (
    ApplicationRoundFactory,
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    TaxLevelFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.test_admin.helpers import collect_admin_form_errors, management_form_data

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxLevel

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def component_form_data(
    index: int,
    *,
    valid_from: str,
    valid_until: str = "",
    tax_level: TaxLevel | None = None,
) -> dict[str, Any]:
    tax_level = tax_level or TaxLevelFactory.create()
    return {
        f"components-{index}-kind": PriceComponentKind.BASE.value,
        f"components-{index}-valid_from": valid_from,
        f"components-{index}-valid_until": valid_until,
        f"components-{index}-amount": "10.00",
        f"components-{index}-price_unit": PriceUnit.PER_HOUR.value,
        f"components-{index}-tax_level": tax_level.pk,
        f"components-{index}-material_price_description_fi": "",
        f"components-{index}-material_price_description_en": "",
        f"components-{index}-material_price_description_sv": "",
    }


def saved_component_form_data(index: int, component: PriceComponent, **overrides: str) -> dict[str, Any]:
    data = {
        **component_form_data(
            index,
            valid_from=component.valid_from.isoformat(),
            valid_until=component.valid_until.isoformat() if component.valid_until else "",
            tax_level=component.tax_level,
        ),
        f"components-{index}-id": component.pk,
        f"components-{index}-pricing_group": component.pricing_group.pk,
    }
    data.update({f"components-{index}-{key}": value for key, value in overrides.items()})
    return data


def group_form_data() -> dict[str, Any]:
    return {
        "name_fi": "Hinnasto",
        "name_en": "Prices",
        "name_sv": "Priser",
    }


# ── Save ──


def test_pricing_group_admin__create_with_component_and_reservation_unit(api_client):
    api_client.force_login(UserFactory.create_superuser())
    reservation_unit = ReservationUnitFactory.create()
    tax_level = TaxLevelFactory.create()

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01", tax_level=tax_level),
        "reservation_unit_pricing_groups-0-reservation_unit": reservation_unit.pk,
        "reservation_unit_pricing_groups-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    pricing_group = PricingGroup.objects.get(name_fi="Hinnasto")
    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert len(components) == 1
    assert components[0].amount == Decimal(10)
    assert components[0].tax_level == tax_level
    rows = list(ReservationUnitPricingGroup.objects.filter(pricing_group=pricing_group))
    assert len(rows) == 1
    assert rows[0].reservation_unit == reservation_unit


def test_pricing_group_admin__new_components_send_accounting_of_reservation_units(api_client, settings):
    settings.UPDATE_ACCOUNTING = True
    api_client.force_login(UserFactory.create_superuser())
    pricing_group = PricingGroupFactory.create(name_fi="Hinnasto", name_en="Prices", name_sv="Priser")
    reservation_unit = ReservationUnitFactory.create()
    row = ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=datetime.date(2026, 1, 1),
    )

    url = reverse("admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group.pk])
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        "reservation_unit_pricing_groups-0-id": row.pk,
        "reservation_unit_pricing_groups-0-pricing_group": pricing_group.pk,
        "reservation_unit_pricing_groups-0-reservation_unit": reservation_unit.pk,
        "reservation_unit_pricing_groups-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=1, initial_forms=1),
    }

    with patch.object(refresh_reservation_unit_accounting_task, "delay_on_commit") as mock:
        response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1
    assert [call.args for call in mock.call_args_list] == [(reservation_unit.pk,)]


# ── Validation ──


def test_pricing_group_admin__overlapping_components_are_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        **component_form_data(1, valid_from="2026-02-01"),
        **management_form_data("components", total_forms=2),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                "Pricing group has more than one price from 2026-02-01 onward. "
                "Price components: new from 2026-01-01, new from 2026-02-01."
            ),
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
        "reservation_unit_pricing_groups-0-reservation_unit": reservation_unit.pk,
        "reservation_unit_pricing_groups-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=1),
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
        "reservation_unit_pricing_groups-0-reservation_unit": first.pk,
        "reservation_unit_pricing_groups-0-begins": "2026-01-01",
        "reservation_unit_pricing_groups-1-reservation_unit": second.pk,
        "reservation_unit_pricing_groups-1-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=2),
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


def test_pricing_group_admin__inactive_option_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    option = PriceOptionFactory.create(unit_group=unit_group, is_active=False)

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        "unit_group": unit_group.pk,
        **component_form_data(0, valid_from="2026-01-01"),
        "components-0-price_option": option.pk,
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": error_codes.PRICE_COMPONENT_OPTION_INACTIVE,
            "message": "Price option is not active.",
        },
    ]
    assert not PricingGroup.objects.exists()


def test_pricing_group_admin__invalid_reservation_unit_row_on_add_shows_errors(api_client):
    api_client.force_login(UserFactory.create_superuser())

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2026-01-01"),
        "reservation_unit_pricing_groups-0-reservation_unit": "",
        "reservation_unit_pricing_groups-0-begins": "2026-01-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=1),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert not PricingGroup.objects.exists()


def test_pricing_group_admin__reservation_unit_in_application_round_cannot_lose_price_option(api_client):
    api_client.force_login(UserFactory.create_superuser())
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    shared_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=shared_group, price_option=adults, valid_from=datetime.date(2027, 1, 1))
    row = ReservationUnitPricingGroupFactory.create(pricing_group=shared_group, begins=datetime.date(2027, 1, 1))
    application_round = ApplicationRoundFactory.create(
        name="Kesä",
        reservation_units=[row.reservation_unit],
        application_period_begins_at=datetime.datetime(2027, 1, 1, tzinfo=datetime.UTC),
        application_period_ends_at=datetime.datetime(2027, 2, 1, tzinfo=datetime.UTC),
        reservation_period_begin_date=datetime.date(2027, 5, 1),
        reservation_period_end_date=datetime.date(2027, 8, 31),
    )

    url = reverse("admin:tilavarauspalvelu_pricinggroup_add")
    data = {
        **group_form_data(),
        **component_form_data(0, valid_from="2027-01-01"),
        "reservation_unit_pricing_groups-0-reservation_unit": row.reservation_unit.pk,
        "reservation_unit_pricing_groups-0-begins": "2027-06-01",
        **management_form_data("components", total_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=1),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": "",
            "message": (
                f"Application round '{application_round.name}': "
                f"Reservation unit {row.reservation_unit.pk} has price options (none) on 2027-06-01, "
                f"but reservation unit {row.reservation_unit.pk} has 'Adults' on 2027-05-01. "
                "All reservation units must have the same price options for the whole reservation period."
            ),
        },
        {
            "code": "",
            "message": (
                f"Application round '{application_round.name}': "
                "The change removes price options 'Adults' from the application round. "
                "Applicants can select them until the reservations of the round are made."
            ),
        },
    ]
    assert not PricingGroup.objects.filter(name_fi="Hinnasto").exists()


# ── Edit rules ──


@freeze_time("2026-02-15T12:00:00+02:00")
def test_pricing_group_admin__active_component_amount_change_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    pricing_group = PricingGroupFactory.create(name_fi="Hinnasto")
    component = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1))

    url = reverse("admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group.pk])
    data = {
        **group_form_data(),
        **saved_component_form_data(0, component, amount="20.00"),
        **management_form_data("components", total_forms=1, initial_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": error_codes.PRICE_COMPONENT_ACTIVE_CHANGED,
            "message": f"Price component {component.pk} is active. Only its end date can be changed.",
        },
    ]
    component.refresh_from_db()
    assert component.amount == Decimal(10)


@freeze_time("2026-02-15T12:00:00+02:00")
def test_pricing_group_admin__active_component_delete_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    pricing_group = PricingGroupFactory.create(name_fi="Hinnasto")
    component = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1))

    url = reverse("admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group.pk])
    data = {
        **group_form_data(),
        **saved_component_form_data(0, component, DELETE="on"),
        **management_form_data("components", total_forms=1, initial_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": error_codes.PRICE_COMPONENT_ACTIVE_DELETED,
            "message": f"Price component {component.pk} is active and cannot be deleted.",
        },
    ]
    assert PriceComponent.objects.filter(pk=component.pk).exists()


@freeze_time("2026-02-15T12:00:00+02:00")
def test_pricing_group_admin__new_component_from_today_is_rejected(api_client):
    api_client.force_login(UserFactory.create_superuser())
    pricing_group = PricingGroupFactory.create(name_fi="Hinnasto")
    component = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1))

    url = reverse("admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group.pk])
    data = {
        **group_form_data(),
        **saved_component_form_data(0, component, valid_until="2026-02-16"),
        **component_form_data(1, valid_from="2026-02-15"),
        **management_form_data("components", total_forms=2, initial_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }

    errors: list[dict[str, Any]] = []
    with collect_admin_form_errors(errors):
        response = api_client.post(path=url, data=data)

    assert response.status_code == 200
    assert errors == [
        {
            "code": error_codes.PRICE_COMPONENT_VALID_FROM_NOT_IN_FUTURE,
            "message": "New price component must begin after today, not on 2026-02-15.",
        },
    ]
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


@freeze_time("2026-02-15T12:00:00+02:00")
def test_pricing_group_admin__price_change_from_future_date_is_saved(api_client):
    api_client.force_login(UserFactory.create_superuser())
    pricing_group = PricingGroupFactory.create(name_fi="Hinnasto")
    component = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=datetime.date(2026, 1, 1))

    url = reverse("admin:tilavarauspalvelu_pricinggroup_change", args=[pricing_group.pk])
    data = {
        **group_form_data(),
        **saved_component_form_data(0, component, valid_until="2026-03-01"),
        **component_form_data(1, valid_from="2026-03-01"),
        **management_form_data("components", total_forms=2, initial_forms=1),
        **management_form_data("reservation_unit_pricing_groups", total_forms=0),
    }
    response = api_client.post(path=url, data=data)

    assert response.status_code == 302, response.content

    component.refresh_from_db()
    assert component.valid_until == datetime.date(2026, 3, 1)
    assert PriceComponent.objects.filter(pricing_group=pricing_group, valid_from="2026-03-01").exists()
