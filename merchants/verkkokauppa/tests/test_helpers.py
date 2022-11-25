from datetime import datetime, timedelta
from unittest.mock import patch

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from freezegun import freeze_time
from pytz import UTC

from applications.models import CUSTOMER_TYPES
from merchants.tests.factories import PaymentProductFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory

from ..helpers import (
    create_verkkokauppa_order,
    get_formatted_reservation_time,
    get_validated_phone_number,
)


@freeze_time("2022-11-05T10:00:00")
class HelpersTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.user = get_user_model().objects.create(
            username="test_user",
            first_name="First",
            last_name="Last",
            email="first.last@foo.com",
        )
        self.reservation_unit = ReservationUnitFactory(
            name_fi="Suomeksi", name_sv="Ruotsiksi", name_en="Englanniksi"
        )

        begin = datetime.now(UTC)
        end = begin + timedelta(hours=2)
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.user,
            begin=begin,
            end=end,
        )

    def test_get_formatted_reservation_time_fi(self):
        self.user.preferred_language = "fi"
        self.user.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("La 05.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_sv(self):
        self.user.preferred_language = "sv"
        self.user.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("Lö 05.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_en(self):
        self.user.preferred_language = "en"
        self.user.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("Sa 05.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_fi_fallback(self):
        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("La 05.11.2022 10:00-12:00")

    def test_get_validated_phone_number(self):
        assert_that(get_validated_phone_number("+358 50 123 4567")).is_equal_to(
            "+358 50 123 4567"
        )
        assert_that(get_validated_phone_number("+358 50 023 4567")).is_equal_to(
            "+358 50 023 4567"
        )
        assert_that(get_validated_phone_number("+358501234567")).is_equal_to(
            "+358501234567"
        )
        assert_that(get_validated_phone_number("+358-50-123-4567")).is_equal_to(
            "+358 50 123 4567"
        )
        assert_that(get_validated_phone_number(" +358  50-  123- 4567  ")).is_equal_to(
            "+358 50 123 4567"
        )
        assert_that(get_validated_phone_number("+1-55-50  10 0 ")).is_equal_to(
            "+1 55 50 10 0"
        )
        assert_that(get_validated_phone_number("+1 55 50 10 0")).is_equal_to(
            "+1 55 50 10 0"
        )
        assert_that(get_validated_phone_number("050 123 4567")).is_equal_to("")
        assert_that(get_validated_phone_number("(+358) 50 123 4567")).is_equal_to("")

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_create_verkkokauppa_order_phone_number_is_set(self, mock_create_order):
        user = get_user_model().objects.create(
            username="testuser",
            first_name="Test",
            last_name="User",
            email="test.user@example.com",
        )
        payment_product = PaymentProductFactory()
        runit = ReservationUnitFactory(payment_product=payment_product)
        reservation = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_phone="+358 50 123 4567",
        )

        create_verkkokauppa_order(reservation)
        assert_that(mock_create_order.call_args.args[0].customer.phone).is_equal_to(
            reservation.reservee_phone
        )

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_create_verkkokauppa_order_phone_number_is_not_set_when_not_individual(
        self, mock_create_order
    ):
        user = get_user_model().objects.create(
            username="testuser",
            first_name="Test",
            last_name="User",
            email="test.user@example.com",
        )
        payment_product = PaymentProductFactory()
        runit = ReservationUnitFactory(payment_product=payment_product)
        reservation = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
            reservee_phone="+358 50 123 4567",
        )

        create_verkkokauppa_order(reservation)
        assert_that(mock_create_order.call_args.args[0].customer.phone).is_equal_to("")

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_create_verkkokauppa_order_phone_number_is_not_set_when_invalid(
        self, mock_create_order
    ):
        user = get_user_model().objects.create(
            username="testuser",
            first_name="Test",
            last_name="User",
            email="test.user@example.com",
        )
        payment_product = PaymentProductFactory()
        runit = ReservationUnitFactory(payment_product=payment_product)
        reservation = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_phone="1234-333",
        )

        create_verkkokauppa_order(reservation)
        assert_that(mock_create_order.call_args.args[0].customer.phone).is_equal_to("")
