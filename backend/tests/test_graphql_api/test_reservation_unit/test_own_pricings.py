from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import PriceComponent, ReservationUnit, ReservationUnitPricingGroup
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

from tests.factories import (
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)

from .helpers import CREATE_MUTATION, UPDATE_MUTATION, get_create_draft_input_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def own_pricing_input(*, begins: datetime.date, amount: str, pk: int | None = None) -> dict:
    data = {
        "begins": begins.isoformat(),
        "amount": amount,
        "priceUnit": PriceUnit.PER_HOUR,
        "paymentType": PaymentType.ONLINE,
        "canApplyForDiscount": True,
    }
    if pk is not None:
        data["pk"] = pk
    return data


# ── Create ──


def test_reservation_unit__own_pricings__create(graphql):
    today = local_date()

    graphql.login_with_superuser()

    input_data = get_create_draft_input_data(ownPricings=[own_pricing_input(begins=today, amount="10.00")])
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    reservation_unit = ReservationUnit.objects.get(pk=response.first_query_object["pk"])
    rows = list(ReservationUnitPricingGroup.objects.filter(reservation_unit=reservation_unit))
    assert len(rows) == 1
    assert rows[0].begins == today
    assert rows[0].pricing_group.unit_group is None
    assert rows[0].pricing_group.name_fi == "Name FI"

    components = list(PriceComponent.objects.filter(pricing_group=rows[0].pricing_group))
    assert len(components) == 1
    assert components[0].valid_from == today
    assert components[0].valid_until is None
    assert components[0].amount == Decimal(10)
    assert components[0].can_apply_for_discount is True


# ── Update ──


def test_reservation_unit__own_pricings__first_pricing_can_begin_in_the_past(graphql):
    begins = local_date() - datetime.timedelta(days=10)
    reservation_unit = ReservationUnitFactory.create(is_draft=True)

    graphql.login_with_superuser()

    input_data = {"pk": reservation_unit.pk, "ownPricings": [own_pricing_input(begins=begins, amount="10.00")]}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    row = ReservationUnitPricingGroup.objects.get(reservation_unit=reservation_unit)
    assert row.begins == begins
    assert list(row.pricing_group.components.values_list("valid_from", flat=True)) == [begins]


def test_reservation_unit__own_pricings__add_future_pricing(graphql):
    today = local_date()
    future_date = today + datetime.timedelta(days=10)
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    active = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        can_apply_for_discount=True,
    )

    graphql.login_with_superuser()

    input_data = {
        "pk": reservation_unit.pk,
        "ownPricings": [
            own_pricing_input(begins=active.valid_from, amount="10.00", pk=active.pk),
            own_pricing_input(begins=future_date, amount="20.00"),
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group).order_by("valid_from"))
    assert len(components) == 2
    assert components[0].pk == active.pk
    assert components[0].valid_until == future_date
    assert components[1].valid_from == future_date
    assert components[1].valid_until is None
    assert components[1].amount == Decimal(20)


def test_reservation_unit__own_pricings__remove_future_pricing(graphql):
    today = local_date()
    future_date = today + datetime.timedelta(days=10)
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today - datetime.timedelta(days=10),
    )
    active = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=today - datetime.timedelta(days=10),
        valid_until=future_date,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        can_apply_for_discount=True,
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=future_date)

    graphql.login_with_superuser()

    input_data = {
        "pk": reservation_unit.pk,
        "ownPricings": [own_pricing_input(begins=active.valid_from, amount="10.00", pk=active.pk)],
    }
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert components == [active]
    assert components[0].valid_until is None


# ── Pricing group rules ──


def test_reservation_unit__own_pricings__shared_group_is_rejected(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    pricing_group = PricingGroupFactory.create(unit_group=UnitGroupFactory.create())
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=today,
    )
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=today)

    graphql.login_with_superuser()

    future_date = today + datetime.timedelta(days=10)
    input_data = {"pk": reservation_unit.pk, "ownPricings": [own_pricing_input(begins=future_date, amount="20.00")]}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_error_messages() == [
        "Reservation unit uses a shared pricing group. Its prices cannot be set here.",
    ]
    assert response.field_error_codes() == [error_codes.RESERVATION_UNIT_USES_SHARED_PRICING_GROUP]

    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


def test_reservation_unit__own_pricings__own_group_used_by_another_reservation_unit(graphql):
    today = local_date()
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    pricing_group = PricingGroupFactory.create(unit_group=None)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit, pricing_group=pricing_group, begins=today
    )
    ReservationUnitPricingGroupFactory.create(pricing_group=pricing_group, begins=today)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=today)

    graphql.login_with_superuser()

    future_date = today + datetime.timedelta(days=10)
    input_data = {"pk": reservation_unit.pk, "ownPricings": [own_pricing_input(begins=future_date, amount="20.00")]}
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is True, response
    assert response.field_error_messages() == [
        "A pricing group without a unit group can be used by only one reservation unit.",
    ]
    assert response.field_error_codes() == [error_codes.PRICING_GROUP_OWN_GROUP_HAS_MANY_RESERVATION_UNITS]

    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1
