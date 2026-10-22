from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType, PriceUnit, UserRoleChoice
from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

from tests.factories import (
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
    UserFactory,
)

from .helpers import UPDATE_COMPONENTS_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def component_input(component: PriceComponent, **overrides) -> dict:
    data = {
        "pk": component.pk,
        "validFrom": component.valid_from.isoformat(),
        "validUntil": component.valid_until.isoformat() if component.valid_until else None,
        "amount": str(component.amount),
        "priceUnit": component.price_unit,
        "paymentType": component.payment_type,
        "canApplyForDiscount": component.can_apply_for_discount,
        "materialPriceDescriptionFi": component.material_price_description_fi or "",
        "materialPriceDescriptionEn": component.material_price_description_en or "",
        "materialPriceDescriptionSv": component.material_price_description_sv or "",
    }
    data.update(overrides)
    return data


# ── Price change ──


def test_pricing_group__update_components__price_change_from_a_future_date(graphql):
    today = local_date()
    change_date = today + datetime.timedelta(days=10)

    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(10),
    )

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [
            component_input(active, validUntil=change_date.isoformat()),
            {
                "validFrom": change_date.isoformat(),
                "amount": "20.00",
                "priceUnit": PriceUnit.PER_HOUR,
                "paymentType": PaymentType.ONLINE,
            },
        ],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group).order_by("valid_from"))
    assert len(components) == 2
    assert components[0].pk == active.pk
    assert components[0].valid_until == change_date
    assert components[1].valid_from == change_date
    assert components[1].valid_until is None
    assert components[1].amount == Decimal(20)
    assert components[1].payment_type == PaymentType.ONLINE


def test_pricing_group__update_components__delete_future_component(graphql):
    today = local_date()
    change_date = today + datetime.timedelta(days=10)

    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        valid_until=change_date,
    )
    future = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=change_date)

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [component_input(active, validUntil=None)],
        "deletedComponents": [future.pk],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert components == [active]
    assert components[0].valid_until is None


# ── Edit rules ──


def test_pricing_group__update_components__past_component_cannot_change(graphql):
    today = local_date()

    pricing_group = PricingGroupFactory.create()
    past = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=20),
        valid_until=today - datetime.timedelta(days=10),
        amount=Decimal(10),
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=today - datetime.timedelta(days=10))

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [component_input(past, amount="99.00")],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_error_messages() == [f"Price component {past.pk} is in the past and cannot be changed."]
    assert response.field_error_codes() == [error_codes.PRICE_COMPONENT_PAST_CHANGED]

    assert PriceComponent.objects.get(pk=past.pk).amount == Decimal(10)


def test_pricing_group__update_components__active_component_amount_cannot_change(graphql):
    today = local_date()

    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(10),
    )

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [component_input(active, amount="99.00")],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_error_codes() == [error_codes.PRICE_COMPONENT_ACTIVE_CHANGED]

    assert PriceComponent.objects.get(pk=active.pk).amount == Decimal(10)


def test_pricing_group__update_components__coverage_errors_are_returned(graphql):
    today = local_date()
    change_date = today + datetime.timedelta(days=10)

    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=today - datetime.timedelta(days=10))

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [component_input(active, validUntil=change_date.isoformat())],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_error_messages() == [
        f"Pricing group has no price from {change_date.isoformat()} onward.",
    ]
    assert response.field_error_codes() == [error_codes.PRICING_GROUP_COVERAGE_GAP]

    assert PriceComponent.objects.get(pk=active.pk).valid_until is None


def test_pricing_group__update_components__required_fields(graphql):
    pricing_group = PricingGroupFactory.create()

    graphql.login_with_superuser()

    input_data = {
        "pk": pricing_group.pk,
        "components": [{"validUntil": None}],
    }
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_errors == [
        {
            "field": "components.0.nonFieldErrors",
            "message": "Price component is missing required fields: valid_from, amount, price_unit.",
            "code": error_codes.REQUIRED_FIELD_MISSING,
        },
    ]

    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


# ── Permissions ──


def new_component_input() -> dict:
    return {
        "validFrom": local_date().isoformat(),
        "amount": "10.00",
        "priceUnit": PriceUnit.PER_HOUR,
        "paymentType": PaymentType.ONLINE,
    }


def test_pricing_group__update_components__anonymous_user(graphql):
    pricing_group = PricingGroupFactory.create()

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_pricing_group__update_components__shared_group__unit_group_admin(graphql):
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    user = UserFactory.create_with_unit_role(unit_groups=[unit_group], role=UserRoleChoice.ADMIN)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


def test_pricing_group__update_components__shared_group__other_unit_group_admin(graphql):
    pricing_group = PricingGroupFactory.create(unit_group=UnitGroupFactory.create())
    user = UserFactory.create_with_unit_role(unit_groups=[UnitGroupFactory.create()], role=UserRoleChoice.ADMIN)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_pricing_group__update_components__shared_group__unit_group_viewer(graphql):
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    user = UserFactory.create_with_unit_role(unit_groups=[unit_group], role=UserRoleChoice.VIEWER)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_pricing_group__update_components__own_group__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=local_date(),
    )
    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit], role=UserRoleChoice.ADMIN)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


def test_pricing_group__update_components__own_group__other_unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=local_date(),
    )
    other_reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[other_reservation_unit.unit], role=UserRoleChoice.ADMIN)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_pricing_group__update_components__general_admin(graphql):
    pricing_group = PricingGroupFactory.create(unit_group=UnitGroupFactory.create())
    user = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)

    graphql.force_login(user)

    input_data = {"pk": pricing_group.pk, "components": [new_component_input()]}
    response = graphql(UPDATE_COMPONENTS_MUTATION, input_data=input_data)

    assert response.has_errors is False, response
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1
