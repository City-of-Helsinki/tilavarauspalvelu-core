from datetime import datetime, timedelta
from decimal import Decimal

import freezegun
from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.timezone import get_default_timezone

from applications.models import CUSTOMER_TYPES
from merchants.tests.factories import PaymentProductFactory
from merchants.verkkokauppa.helpers import _get_order_params, get_validated_phone_number
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import ReservationFactory


class CreateOrderParamsToJsonTestCase(TestCase):
    @freezegun.freeze_time("2023-01-01 00:00:00")
    def test_to_json(self):
        payment_product = PaymentProductFactory()
        reservation_unit = ReservationUnitFactory(payment_product=payment_product)
        user = get_user_model().objects.create_user(
            username="test",
            email="test@localhost",
            first_name="First",
            last_name="Name",
        )

        reservation = ReservationFactory(
            reservation_unit=[reservation_unit],
            user=user,
            price_net=Decimal("10.12"),
            price=Decimal("12.5488"),
            tax_percentage_value=Decimal("24"),
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_first_name="Firstname",
            reservee_last_name="Lastname",
            reservee_email="test@example.com",
            reservee_phone="+358 50 123 4567",
            reservee_language="fi",
        )
        order_params = _get_order_params(reservation)

        json = order_params.to_json()

        assert_that(json["namespace"]).is_equal_to(settings.VERKKOKAUPPA_NAMESPACE)
        assert_that(json["user"]).is_equal_to(str(reservation.user.uuid))
        assert_that(json["language"]).is_equal_to(reservation.reservee_language or "fi")
        assert_that(json["priceNet"]).is_equal_to("10.12")
        assert_that(json["priceVat"]).is_equal_to("2.43")
        assert_that(json["priceTotal"]).is_equal_to("12.55")
        assert_that(json["customer"]["firstName"]).is_equal_to("Firstname")
        assert_that(json["customer"]["lastName"]).is_equal_to("Lastname")
        assert_that(json["customer"]["email"]).is_equal_to("test@example.com")
        assert_that(json["customer"]["phone"]).is_equal_to(get_validated_phone_number(reservation.reservee_phone))
        assert_that(json["lastValidPurchaseDateTime"]).is_equal_to(
            (
                datetime.now(tz=get_default_timezone())
                + timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
            ).strftime("%Y-%m-%dT%H:%M:%S")
        )
        assert_that(json["items"]).is_length(1)
        assert_that(json["items"][0]["productId"]).is_equal_to(
            str(reservation.reservation_unit.first().payment_product.id)
        )
        assert_that(json["items"][0]["productName"]).is_equal_to(reservation.reservation_unit.first().name_fi)
        assert_that(json["items"][0]["quantity"]).is_equal_to(1)
        assert_that(json["items"][0]["unit"]).is_equal_to("pcs")
        assert_that(json["items"][0]["rowPriceNet"]).is_equal_to("10.12")
        assert_that(json["items"][0]["rowPriceVat"]).is_equal_to("2.43")
        assert_that(json["items"][0]["rowPriceTotal"]).is_equal_to("12.55")
        assert_that(json["items"][0]["priceNet"]).is_equal_to("10.12")
        assert_that(json["items"][0]["priceVat"]).is_equal_to("2.43")
        assert_that(json["items"][0]["priceGross"]).is_equal_to("12.55")
        assert_that(json["items"][0]["vatPercentage"]).is_equal_to("24")  # Note this needs to be 24, not 24.00.
        assert_that(json["items"][0]["meta"]).is_length(3)
        assert_that(json["items"][0]["meta"][0]["key"]).is_equal_to("namespaceProductId")
        assert_that(json["items"][0]["meta"][0]["value"]).is_equal_to(str(reservation.reservation_unit.first().uuid))
        assert_that(json["items"][0]["meta"][0]["label"]).is_none()
        assert_that(json["items"][0]["meta"][0]["visibleInCheckout"]).is_false()
        assert_that(json["items"][0]["meta"][0]["ordinal"]).is_equal_to(0)
        assert_that(json["items"][0]["meta"][1]["key"]).is_equal_to("reservationPeriod")
        assert_that(json["items"][0]["meta"][1]["label"]).is_equal_to("Varausaika")
        assert_that(json["items"][0]["meta"][2]["key"]).is_equal_to("reservationNumber")
        assert_that(json["items"][0]["meta"][2]["label"]).is_equal_to("Varausnumero")
        assert_that(json["items"][0]["meta"][2]["value"]).is_equal_to(str(reservation.pk))

    @freezegun.freeze_time("2023-01-01 00:00:00")
    def test_meta_label_language_support(self):
        payment_product = PaymentProductFactory()
        reservation_unit = ReservationUnitFactory(payment_product=payment_product)
        user = get_user_model().objects.create_user(
            username="test",
            email="test@localhost",
            first_name="First",
            last_name="Name",
        )

        reservation = ReservationFactory(
            reservation_unit=[reservation_unit],
            user=user,
            price_net=Decimal("10.12"),
            price=Decimal("12.5488"),
            tax_percentage_value=Decimal("24"),
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_first_name="Firstname",
            reservee_last_name="Lastname",
            reservee_email="test@example.com",
            reservee_phone="+358 50 123 4567",
            reservee_language="en",
        )
        order_params = _get_order_params(reservation)
        json = order_params.to_json()

        assert_that(json["items"][0]["meta"]).is_length(3)
        assert_that(json["items"][0]["meta"][1]["label"]).is_equal_to("Booking time")
        assert_that(json["items"][0]["meta"][2]["label"]).is_equal_to("Booking number")
