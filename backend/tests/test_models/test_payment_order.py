from __future__ import annotations

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, OrderStatus, OrderStatusWithFree

from tests.factories import PaymentOrderFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_order_price_net_fails_when_less_than_0_01():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.0"),
            price_total=Decimal("0.0"),
            price_vat=Decimal("0.0"),
        )

    assert error.value.message_dict == {"price_net": ["Must be greater than 0.01"]}


def test_order_price_vat_fails_when_less_than_0():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.1"),
            price_vat=Decimal("-0.1"),
            price_total=Decimal("0.0"),
        )

    assert error.value.message_dict == {"price_vat": ["Must be greater than 0"]}


def test_order_price_total_fails_when_sum_is_not_correct():
    with pytest.raises(ValidationError) as error:
        PaymentOrderFactory.create(
            price_net=Decimal("0.1"),
            price_vat=Decimal("0.1"),
            price_total=Decimal("10.0"),
        )

    assert error.value.message_dict == {"price_total": ["Must be the sum of net and vat amounts"]}


def test_order_status_and_order_status_with_free_match():
    order_statuses = sorted(OrderStatus)
    order_free_statuses = sorted(OrderStatusWithFree)

    assert "FREE" in order_free_statuses
    assert "FREE" not in order_statuses

    order_free_statuses.remove("FREE")

    assert order_statuses == order_free_statuses


def test_access_type_and_access_type_with_multivalued_match():
    access_types = sorted(AccessType)
    access_types_with_multivalued = sorted(AccessTypeWithMultivalued)

    assert "MULTIVALUED" in access_types_with_multivalued
    assert "MULTIVALUED" not in access_types

    access_types_with_multivalued.remove("MULTIVALUED")

    assert access_types == access_types_with_multivalued
