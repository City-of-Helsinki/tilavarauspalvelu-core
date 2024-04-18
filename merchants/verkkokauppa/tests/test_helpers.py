from datetime import datetime, timedelta

import pytest
from assertpy import assert_that
from django.test import TestCase
from django.utils import timezone
from freezegun import freeze_time

from merchants.verkkokauppa.exceptions import UnsupportedMetaKeyError
from merchants.verkkokauppa.helpers import get_formatted_reservation_time, get_meta_label, get_verkkokauppa_order_params
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import CustomerTypeChoice
from tests.factories import PaymentProductFactory, ReservationFactory, ReservationUnitFactory, UserFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.usefixtures("_setup_verkkokauppa_env_variables"),
]


@freeze_time("2022-11-05T10:00:00")
class HelpersTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.user = UserFactory.create(
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

    @patch_method(VerkkokauppaAPIClient.create_order)
    def test_get_verkkokauppa_order_params_respect_reservee_language(self):
        user = UserFactory.create(
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
            reservee_type=CustomerTypeChoice.INDIVIDUAL,
            reservee_language="en",
        )
        reservation_sv = ReservationFactory(
            reservation_unit=[runit],
            user=user,
            reservee_type=CustomerTypeChoice.INDIVIDUAL,
            reservee_language="sv",
        )

        order_params = get_verkkokauppa_order_params(reservation_en)
        assert order_params.items[0].product_name == "Name"

        order_params = get_verkkokauppa_order_params(reservation_sv)
        assert order_params.items[0].product_name == "Namn"

    def test_get_meta_label_returns_label_with_supported_key(self):
        period_label = get_meta_label("reservationPeriod", self.reservation)
        number_label = get_meta_label("reservationNumber", self.reservation)
        assert_that(period_label).is_equal_to("Varausaika")
        assert_that(number_label).is_equal_to("Varausnumero")

    def test_get_meta_label_raises_exception_with_unsupported_key(self):
        with pytest.raises(UnsupportedMetaKeyError) as err:
            get_meta_label("unsupported", self.reservation)
        assert_that(str(err.value)).is_equal_to("Invalid meta label key 'unsupported'")
