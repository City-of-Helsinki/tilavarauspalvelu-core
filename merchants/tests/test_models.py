from decimal import Decimal
from uuid import uuid4

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test.testcases import TestCase
from pytest import raises

from merchants.models import PaymentOrder
from reservations.tests.factories import ReservationFactory


class PaymentOrderTestCase(TestCase):
    @classmethod
    def setUp(cls):
        cls.user = get_user_model().objects.create(
            username="gen_user",
            first_name="Test",
            last_name="User",
            email="test.user@foo.com",
        )
        cls.reservation = ReservationFactory(user=cls.user)
        cls.valid_args = {
            "reservation": cls.reservation,
            "remote_id": uuid4(),
            "payment_id": "test_payment_id",
            "payment_type": "ON_SITE",
            "status": "DRAFT",
            "price_net": Decimal("0.1"),
            "price_vat": Decimal("0.0"),
            "price_total": Decimal("0.1"),
            "processed_at": None,
            "language": "fi",
        }

    def test_order_price_net_fails_when_less_than_0_01(self):
        self.valid_args["price_net"] = Decimal("0.0")
        self.valid_args["price_total"] = Decimal("0.0")
        with raises(ValidationError) as e:
            PaymentOrder.objects.create(**self.valid_args)
        assert_that(e.value.message_dict).is_equal_to(
            {"price_net": ["Must be greater than 0.01"]}
        )

    def test_order_price_vat_fails_when_less_than_0(self):
        self.valid_args["price_vat"] = Decimal("-0.1")
        self.valid_args["price_total"] = Decimal("0.0")
        with raises(ValidationError) as e:
            PaymentOrder.objects.create(**self.valid_args)
        assert_that(e.value.message_dict).is_equal_to(
            {"price_vat": ["Must be greater than 0"]}
        )

    def test_order_price_total_fails_when_sum_is_not_correct(self):
        self.valid_args["price_total"] = Decimal("10.0")
        with raises(ValidationError) as e:
            PaymentOrder.objects.create(**self.valid_args)
        assert_that(e.value.message_dict).is_equal_to(
            {"price_total": ["Must be the sum of net and vat amounts"]}
        )
