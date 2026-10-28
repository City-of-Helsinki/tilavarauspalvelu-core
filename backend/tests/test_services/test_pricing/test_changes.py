from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time
from rest_framework.exceptions import ErrorDetail, ValidationError

from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.services.pricing.changes import save_price_component_changes
from tilavarauspalvelu.typing import error_codes

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("freeze_today"),
]


JAN_1 = datetime.date(2026, 1, 1)
FEB_1 = datetime.date(2026, 2, 1)
FEB_15 = datetime.date(2026, 2, 15)
MAR_1 = datetime.date(2026, 3, 1)
APR_1 = datetime.date(2026, 4, 1)


# ── Helpers ──


@pytest.fixture
def freeze_today():
    with freeze_time("2026-02-15T12:00:00+02:00"):
        yield


def error_details(error: ValidationError) -> list[ErrorDetail]:
    details = error.detail
    assert isinstance(details, list)
    return details


# ── Price change ──


def test_save_price_component_changes__price_change_from_a_future_date():
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, amount=Decimal(10))

    active.valid_until = MAR_1
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=MAR_1, amount=Decimal(20))

    save_price_component_changes(pricing_group=pricing_group, components=[active, new], deleted_component_pks=[])

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group).order_by("valid_from"))
    assert len(components) == 2
    assert components[0].pk == active.pk
    assert components[0].valid_from == JAN_1
    assert components[0].valid_until == MAR_1
    assert components[0].amount == Decimal(10)
    assert components[1].valid_from == MAR_1
    assert components[1].valid_until is None
    assert components[1].amount == Decimal(20)


def test_save_price_component_changes__first_components_can_begin_in_the_past():
    pricing_group = PricingGroupFactory.create()
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=JAN_1)

    save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert len(components) == 1
    assert components[0].valid_from == JAN_1


def test_save_price_component_changes__future_component_can_be_changed():
    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, valid_until=MAR_1)
    future = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=MAR_1, amount=Decimal(20))

    future.amount = Decimal(30)

    save_price_component_changes(pricing_group=pricing_group, components=[future], deleted_component_pks=[])

    future = PriceComponent.objects.get(pk=future.pk)
    assert future.amount == Decimal(30)


def test_save_price_component_changes__future_component_can_be_deleted():
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, valid_until=MAR_1)
    future = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=MAR_1)

    active.valid_until = None

    save_price_component_changes(pricing_group=pricing_group, components=[active], deleted_component_pks=[future.pk])

    components = list(PriceComponent.objects.filter(pricing_group=pricing_group))
    assert components == [active]
    assert components[0].valid_until is None


# ── Past components ──


def test_save_price_component_changes__past_component_cannot_be_changed():
    pricing_group = PricingGroupFactory.create()
    past = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, valid_until=FEB_1)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=FEB_1)

    past.amount = Decimal(99)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[past], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            f"Price component {past.pk} is in the past and cannot be changed.",
            code=error_codes.PRICE_COMPONENT_PAST_CHANGED,
        ),
    ]
    assert PriceComponent.objects.get(pk=past.pk).amount == Decimal(10)


def test_save_price_component_changes__past_component_cannot_be_deleted():
    pricing_group = PricingGroupFactory.create()
    past = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, valid_until=FEB_1)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=FEB_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[], deleted_component_pks=[past.pk])

    assert error_details(error.value) == [
        ErrorDetail(
            f"Price component {past.pk} is in the past and cannot be deleted.",
            code=error_codes.PRICE_COMPONENT_PAST_DELETED,
        ),
    ]
    assert PriceComponent.objects.filter(pk=past.pk).exists()


# ── Active components ──


def test_save_price_component_changes__active_component_amount_cannot_be_changed():
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)

    active.amount = Decimal(99)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[active], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            f"Price component {active.pk} is active. Only its end date can be changed.",
            code=error_codes.PRICE_COMPONENT_ACTIVE_CHANGED,
        ),
    ]
    assert PriceComponent.objects.get(pk=active.pk).amount == Decimal(10)


@pytest.mark.parametrize("valid_until", [FEB_1, FEB_15])
def test_save_price_component_changes__active_component_end_must_be_in_the_future(valid_until):
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=APR_1)

    active.valid_until = valid_until

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[active, new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            f"End date of price component {active.pk} must be after today.",
            code=error_codes.PRICE_COMPONENT_VALID_UNTIL_NOT_IN_FUTURE,
        ),
    ]
    assert PriceComponent.objects.get(pk=active.pk).valid_until is None


def test_save_price_component_changes__active_component_cannot_be_deleted():
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[], deleted_component_pks=[active.pk])

    assert error_details(error.value) == [
        ErrorDetail(
            f"Price component {active.pk} is active and cannot be deleted.",
            code=error_codes.PRICE_COMPONENT_ACTIVE_DELETED,
        ),
    ]
    assert PriceComponent.objects.filter(pk=active.pk).exists()


# ── New components ──


@pytest.mark.parametrize("valid_from", [FEB_1, FEB_15])
def test_save_price_component_changes__new_component_must_begin_after_today(valid_from):
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=valid_from)

    active.valid_until = MAR_1

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[active, new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            f"New price component must begin after today, not on {valid_from.isoformat()}.",
            code=error_codes.PRICE_COMPONENT_VALID_FROM_NOT_IN_FUTURE,
        ),
    ]
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


def test_save_price_component_changes__component_of_another_group():
    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)
    other = PriceComponentFactory.create(valid_from=MAR_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[other], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            f"Price component {other.pk} does not belong to this pricing group.",
            code=error_codes.PRICE_COMPONENT_NOT_IN_PRICING_GROUP,
        ),
    ]


@pytest.mark.parametrize(
    ("component_fields", "message", "code"),
    [
        (
            {"amount": Decimal(-1)},
            "Amount cannot be negative.",
            error_codes.PRICE_COMPONENT_AMOUNT_NEGATIVE,
        ),
        (
            {"payment_type": None},
            "Payment type is required for a paid component and not allowed for a free one.",
            error_codes.PRICE_COMPONENT_PAYMENT_TYPE_INVALID,
        ),
        (
            {"amount": Decimal(0)},
            "Payment type is required for a paid component and not allowed for a free one.",
            error_codes.PRICE_COMPONENT_PAYMENT_TYPE_INVALID,
        ),
        (
            {"valid_until": JAN_1},
            "Valid from must be before valid until.",
            error_codes.PRICE_COMPONENT_VALID_UNTIL_NOT_AFTER_VALID_FROM,
        ),
    ],
)
def test_save_price_component_changes__model_constraints_are_checked(component_fields, message, code):
    pricing_group = PricingGroupFactory.create()
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=JAN_1, **component_fields)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    assert error_details(error.value) == [ErrorDetail(message, code=code)]
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_save_price_component_changes__model_constraints_are_checked_for_changed_components():
    pricing_group = PricingGroupFactory.create()
    future = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=MAR_1)

    future.amount = Decimal(-1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[future], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail("Amount cannot be negative.", code=error_codes.PRICE_COMPONENT_AMOUNT_NEGATIVE),
    ]
    assert PriceComponent.objects.get(pk=future.pk).amount == Decimal(10)


# ── Price options ──


def test_save_price_component_changes__option_of_another_unit_group():
    pricing_group = PricingGroupFactory.create(unit_group=UnitGroupFactory.create())
    option = PriceOptionFactory.create(unit_group=UnitGroupFactory.create())
    new = PriceComponentFactory.build(pricing_group=pricing_group, price_option=option, valid_from=JAN_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            "Price option must belong to the same unit group as the pricing group.",
            code=error_codes.PRICE_COMPONENT_OPTION_WRONG_UNIT_GROUP,
        ),
    ]
    assert not PriceComponent.objects.filter(pricing_group=pricing_group).exists()


def test_save_price_component_changes__own_group_cannot_use_options():
    pricing_group = PricingGroupFactory.create(unit_group=None)
    option = PriceOptionFactory.create()
    new = PriceComponentFactory.build(pricing_group=pricing_group, price_option=option, valid_from=JAN_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            "Price option must belong to the same unit group as the pricing group.",
            code=error_codes.PRICE_COMPONENT_OPTION_WRONG_UNIT_GROUP,
        ),
    ]


def test_save_price_component_changes__inactive_option():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    option = PriceOptionFactory.create(unit_group=unit_group, is_active=False)
    new = PriceComponentFactory.build(pricing_group=pricing_group, price_option=option, valid_from=JAN_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail("Price option is not active.", code=error_codes.PRICE_COMPONENT_OPTION_INACTIVE),
    ]


def test_save_price_component_changes__existing_component_can_keep_an_inactive_option():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    option = PriceOptionFactory.create(unit_group=unit_group)
    active = PriceComponentFactory.create(pricing_group=pricing_group, price_option=option, valid_from=JAN_1)
    option.is_active = False
    option.save()

    active.valid_until = MAR_1
    new = PriceComponentFactory.build(pricing_group=pricing_group, price_option=None, valid_from=MAR_1)

    save_price_component_changes(pricing_group=pricing_group, components=[active, new], deleted_component_pks=[])

    assert PriceComponent.objects.get(pk=active.pk).valid_until == MAR_1


# ── Coverage ──


def test_save_price_component_changes__coverage_errors_save_nothing():
    pricing_group = PricingGroupFactory.create()
    active = PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=APR_1, amount=Decimal(20))

    active.valid_until = MAR_1

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[active, new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            "Pricing group has no price from 2026-03-01 until 2026-04-01.",
            code=error_codes.PRICING_GROUP_COVERAGE_GAP,
        ),
    ]
    assert PriceComponent.objects.get(pk=active.pk).valid_until is None
    assert PriceComponent.objects.filter(pricing_group=pricing_group).count() == 1


def test_save_price_component_changes__coverage_includes_reservation_units():
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(pricing_group=pricing_group, begins=JAN_1)
    new = PriceComponentFactory.build(pricing_group=pricing_group, valid_from=MAR_1)

    with pytest.raises(ValidationError) as error:
        save_price_component_changes(pricing_group=pricing_group, components=[new], deleted_component_pks=[])

    assert error_details(error.value) == [
        ErrorDetail(
            "A reservation unit uses the pricing group from 2026-01-01, but its prices begin on 2026-03-01.",
            code=error_codes.PRICING_GROUP_BEGINS_BEFORE_COMPONENTS,
        ),
    ]
