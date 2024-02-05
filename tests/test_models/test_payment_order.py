from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

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
