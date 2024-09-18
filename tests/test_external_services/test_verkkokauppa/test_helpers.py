from datetime import datetime, timedelta

import pytest
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from reservations.enums import CustomerTypeChoice
from tests.factories import PaymentProductFactory, ReservationFactory, ReservationUnitFactory, UserFactory
from tilavarauspalvelu.utils.verkkokauppa.exceptions import UnsupportedMetaKeyError
from tilavarauspalvelu.utils.verkkokauppa.helpers import (
    get_formatted_reservation_time,
    get_meta_label,
    get_verkkokauppa_order_params,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("language", "result"),
    [
        ("", "La 5.11.2022 10:00-12:00"),
        ("fi", "La 5.11.2022 10:00-12:00"),
        ("sv", "Lö 5.11.2022 10:00-12:00"),
        ("en", "Sa 5.11.2022 10:00-12:00"),
    ],
)
@freeze_time("2022-11-05T10:00:00")
def test_get_formatted_reservation_time(language, result):
    begin = datetime.now().astimezone(tz=get_default_timezone())
    end = begin + timedelta(hours=2)
    reservation = ReservationFactory.create(begin=begin, end=end, reservee_language=language)
    date = get_formatted_reservation_time(reservation)
    assert date == result


def test_get_verkkokauppa_order_params__respect_reservee_language():
    user = UserFactory.create()
    payment_product = PaymentProductFactory.create()
    runit = ReservationUnitFactory.create(
        payment_product=payment_product,
        name_fi="Nimi",
        name_en="Name",
        name_sv="Namn",
    )

    reservation_en = ReservationFactory.create(
        reservation_unit=[runit],
        user=user,
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_language="en",
    )
    order_params = get_verkkokauppa_order_params(reservation_en)
    assert order_params.items[0].product_name == "Name"

    reservation_sv = ReservationFactory.create(
        reservation_unit=[runit],
        user=user,
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_language="sv",
    )
    order_params = get_verkkokauppa_order_params(reservation_sv)
    assert order_params.items[0].product_name == "Namn"


def test_get_meta_label():
    reservation = ReservationFactory.create()

    period_label = get_meta_label("reservationPeriod", reservation)
    assert period_label == "Varausaika"

    number_label = get_meta_label("reservationNumber", reservation)
    assert number_label == "Varausnumero"


def test_get_meta_label__raises_exception_with_unsupported_key():
    reservation = ReservationFactory.create()

    with pytest.raises(UnsupportedMetaKeyError) as err:
        get_meta_label("unsupported", reservation)
    assert str(err.value) == "Invalid meta label key 'unsupported'"
