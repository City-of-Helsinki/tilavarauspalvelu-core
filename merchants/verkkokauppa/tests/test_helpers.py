from datetime import datetime, timedelta
from unittest.mock import patch

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from freezegun import freeze_time
from pytest import raises

from applications.models import CUSTOMER_TYPES
from merchants.verkkokauppa.exceptions import UnsupportedMetaKey
from tests.factories import PaymentProductFactory, ReservationFactory, ReservationUnitFactory

from ..helpers import (
    create_verkkokauppa_order,
    get_formatted_reservation_time,
    get_meta_label,
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
        self.reservation_unit = ReservationUnitFactory(name_fi="Suomeksi", name_sv="Ruotsiksi", name_en="Englanniksi")

        begin = datetime.now().astimezone(timezone.get_default_timezone())
        end = begin + timedelta(hours=2)
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.user,
            begin=begin,
            end=end,
        )

    def test_get_formatted_reservation_time_fi(self):
        self.reservation.reservee_language = "fi"
        self.reservation.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("La 5.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_sv(self):
        self.reservation.reservee_language = "sv"
        self.reservation.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("Lö 5.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_en(self):
        self.reservation.reservee_language = "en"
        self.reservation.save()

        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("Sa 5.11.2022 10:00-12:00")

    def test_get_formatted_reservation_time_fi_fallback(self):
        date = get_formatted_reservation_time(self.reservation)
        assert_that(date).is_equal_to("La 5.11.2022 10:00-12:00")

    def test_get_validated_phone_number(self):
        assert_that(get_validated_phone_number("+358 50 123 4567")).is_equal_to("+358 50 123 4567")
        assert_that(get_validated_phone_number("+358 50 023 4567")).is_equal_to("+358 50 023 4567")
        assert_that(get_validated_phone_number("+358501234567")).is_equal_to("+358501234567")
        assert_that(get_validated_phone_number("+358-50-123-4567")).is_equal_to("+358 50 123 4567")
        assert_that(get_validated_phone_number(" +358  50-  123- 4567  ")).is_equal_to("+358 50 123 4567")
        assert_that(get_validated_phone_number("+1-55-50  10 0 ")).is_equal_to("+1 55 50 10 0")
        assert_that(get_validated_phone_number("+1 55 50 10 0")).is_equal_to("+1 55 50 10 0")
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
        assert_that(mock_create_order.call_args.args[0].customer.phone).is_equal_to(reservation.reservee_phone)

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_create_verkkokauppa_order_phone_number_is_not_set_when_not_individual(self, mock_create_order):
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
    def test_create_verkkokauppa_order_phone_number_is_not_set_when_invalid(self, mock_create_order):
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

    @patch("merchants.verkkokauppa.helpers.create_order")
    def test_create_verkkokauppa_order_respect_reservee_language(self, mock_create_order):
        user = get_user_model().objects.create(
            username="testuser",
            first_name="Test",
            last_name="User",
            email="test.user@example.com",
        )
        payment_product = PaymentProductFactory()
        runit = ReservationUnitFactory(
            payment_product=payment_product,
            name_fi="Nimi",
            name_en="Name",
            name_sv="Namn",
        )
        reservation_en = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_language="en",
        )
        reservation_sv = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_language="sv",
        )

        create_verkkokauppa_order(reservation_en)
        assert_that(mock_create_order.call_args.args[0].items[0].product_name).is_equal_to("Name")

        create_verkkokauppa_order(reservation_sv)
        assert_that(mock_create_order.call_args.args[0].items[0].product_name).is_equal_to("Namn")

    def test_get_meta_label_returns_label_with_supported_key(self):
        period_label = get_meta_label("reservationPeriod", self.reservation)
        number_label = get_meta_label("reservationNumber", self.reservation)
        assert_that(period_label).is_equal_to("Varausaika")
        assert_that(number_label).is_equal_to("Varausnumero")

    def test_get_meta_label_raises_exception_with_unsupported_key(self):
        with raises(UnsupportedMetaKey) as err:
            get_meta_label("unsupported", self.reservation)
        assert_that(str(err.value)).is_equal_to("Invalid meta label key 'unsupported'")
