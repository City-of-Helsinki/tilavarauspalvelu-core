from __future__ import annotations

import datetime

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReserveeType
from tilavarauspalvelu.integrations.verkkokauppa.exceptions import UnsupportedMetaKeyError
from tilavarauspalvelu.integrations.verkkokauppa.helpers import (
    get_formatted_reservation_time,
    get_meta_label,
    get_verkkokauppa_order_params,
)
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import PaymentProductFactory, ReservationFactory, ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    ("language", "result"),
    [
        ("fi", "La 5.11.2022 10:00-12:00"),
        ("sv", "Lö 5.11.2022 10:00-12:00"),
        ("en", "Sa 5.11.2022 10:00-12:00"),
    ],
)
@freeze_time("2022-11-05T10:00:00")
def test_get_formatted_reservation_time(language, result):
    begin = datetime.datetime.now().astimezone(tz=DEFAULT_TIMEZONE)
    end = begin + datetime.timedelta(hours=2)
    reservation = ReservationFactory.create(begins_at=begin, ends_at=end, user__preferred_language=language)
    date = get_formatted_reservation_time(reservation)
    assert date == result


def test_get_verkkokauppa_order_params__respect_reservee_language():
    payment_product = PaymentProductFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_product=payment_product,
        name_fi="Nimi",
        name_en="Name",
        name_sv="Namn",
    )

    reservation_en = ReservationFactory.create(
        reservation_unit=reservation_unit,
        user__preferred_language="en",
        reservee_type=ReserveeType.INDIVIDUAL,
    )
    order_params = get_verkkokauppa_order_params(reservation_en)
    assert order_params.items[0].product_name == "Name"

    reservation_sv = ReservationFactory.create(
        reservation_unit=reservation_unit,
        user__preferred_language="sv",
        reservee_type=ReserveeType.INDIVIDUAL,
    )
    order_params = get_verkkokauppa_order_params(reservation_sv)
    assert order_params.items[0].product_name == "Namn"


def test_get_meta_label():
    reservation = ReservationFactory.create(user__preferred_language="fi")

    period_label = get_meta_label("reservationPeriod", reservation)
    assert period_label == "Varausaika"

    number_label = get_meta_label("reservationNumber", reservation)
    assert number_label == "Varausnumero"


def test_get_meta_label__raises_exception_with_unsupported_key():
    reservation = ReservationFactory.create(user__preferred_language="fi")

    with pytest.raises(UnsupportedMetaKeyError) as err:
        get_meta_label("unsupported", reservation)
    assert str(err.value) == "Invalid meta label key 'unsupported'"
