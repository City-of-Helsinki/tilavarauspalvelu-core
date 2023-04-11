from decimal import Decimal
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import override_settings
from django.test.testcases import TestCase
from pytest import raises

from merchants.models import PaymentOrder
from merchants.tests.factories import PaymentAccountingFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import UnitFactory


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


@override_settings(UPDATE_ACCOUNTING=True)
@mock.patch("reservation_units.tasks.refresh_reservation_unit_accounting.delay")
class PaymentAccountingTestCase(TestCase):
    @classmethod
    def setUp(cls):
        cls.unit = UnitFactory(name="Test unit")
        cls.reservation_unit_1 = ReservationUnitFactory(name="Reservation unit 1")
        cls.reservation_unit_2 = ReservationUnitFactory(
            name="Reservation unit 2", unit=cls.unit
        )
        cls.accounting = PaymentAccountingFactory(name="Test accounting")

    def test_webshop_sync_is_not_triggered_when_accounting_is_not_used(
        self, mock_upsert_accounting
    ):
        self.accounting.save()
        assert_that(mock_upsert_accounting.called).is_false()

    def test_webshop_sync_trigger_reservation_units(self, mock_upsert_accounting):
        self.reservation_unit_1.payment_accounting = self.accounting
        self.reservation_unit_1.save()

        self.accounting.refresh_from_db()
        self.accounting.save()

        mock_upsert_accounting.assert_called_with(self.reservation_unit_1.pk)
        assert_that(mock_upsert_accounting.call_count).is_equal_to(1)

    def test_webshop_sync_updates_runits_under_units(self, mock_upsert_accounting):
        self.unit.payment_accounting = self.accounting
        self.unit.save()

        self.accounting.refresh_from_db()
        self.accounting.save()

        mock_upsert_accounting.assert_called_with(self.reservation_unit_2.pk)
        assert_that(mock_upsert_accounting.call_count).is_equal_to(1)

    def test_webshop_sync_updates_all_unique_runits(self, mock_upsert_accounting):
        self.reservation_unit_1.payment_accounting = self.accounting
        self.reservation_unit_1.save()

        self.unit.payment_accounting = self.accounting
        self.unit.save()

        self.accounting.refresh_from_db()
        self.accounting.save()

        assert_that(mock_upsert_accounting.mock_calls).contains_only(
            mock.call(self.reservation_unit_1.pk), mock.call(self.reservation_unit_2.pk)
        )
        assert_that(mock_upsert_accounting.call_count).is_equal_to(2)

    def test_one_of_the_fields_is_required(self, mock_upsert_accounting):
        failing = PaymentAccountingFactory(
            name="Invalid", internal_order=None, profit_center=None, project=None
        )
        with raises(ValidationError) as err:
            failing.full_clean()
        assert_that(err.value.message_dict).is_equal_to(
            {
                "internal_order": [
                    "One of the following fields must be given: internal_order, profit_center, project"
                ],
                "profit_center": [
                    "One of the following fields must be given: internal_order, profit_center, project"
                ],
                "project": [
                    "One of the following fields must be given: internal_order, profit_center, project"
                ],
            }
        )
