import re
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from django.conf import settings
from django.utils.timezone import get_default_timezone
from sentry_sdk import capture_exception, push_scope

from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from applications.models import CUSTOMER_TYPES
from merchants.verkkokauppa.exceptions import UnsupportedMetaKey
from merchants.verkkokauppa.order.exceptions import CreateOrderError
from merchants.verkkokauppa.order.requests import create_order
from merchants.verkkokauppa.order.types import (
    CreateOrderParams,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
)
from reservations.models import Reservation
from tilavarauspalvelu.utils.date_util import localized_short_weekday
from utils.decimal_utils import round_decimal


def parse_datetime(string: Optional[str]) -> Optional[datetime]:
    if string is None:
        return None
    return datetime.strptime(string, "%Y-%m-%dT%H:%M:%S.%f").astimezone(
        settings.VERKKOKAUPPA_TIMEZONE
    )


def get_formatted_reservation_time(reservation: Reservation) -> str:
    """
    Weekday is localized based on user's preferred language, but rest
    of the format is always the same: ww dd.mm.yyyy hh:mm-hh:mm
    """
    begin = reservation.begin.astimezone(get_default_timezone())
    end = reservation.end.astimezone(get_default_timezone())

    preferred_language = reservation.reservee_language or "fi"
    weekday = localized_short_weekday(begin.weekday(), preferred_language)
    date = "{d.day}.{d.month}.{d.year}".format(d=begin)
    start_time = begin.strftime("%H:%M")
    end_time = end.strftime("%H:%M")

    return begin.strftime(f"{weekday} {date} {start_time}-{end_time}")


def get_validated_phone_number(phone_number: str) -> str:
    if not phone_number:
        return None

    phone_number = phone_number.replace("-", " ")
    phone_number = re.sub(" +", " ", phone_number)
    phone_number = phone_number.strip()

    pattern = r"^\+(?:[0-9] ?){6,14}[0-9]$"
    match = re.match(pattern, phone_number)
    if match:
        return match.group(0)

    return ""


def get_meta_label(key: str, reservation: Reservation) -> str:
    labels = {
        "reservationPeriod": {
            "fi": "Varausaika",
            "en": "Booking time",
            "sv": "Bokningstiden",
        },
        "reservationNumber": {
            "fi": "Varausnumero",
            "en": "Booking number",
            "sv": "Bokningsnummer",
        },
    }
    if key not in labels:
        raise UnsupportedMetaKey(f"Invalid meta label key '{key}'")

    preferred_language = reservation.reservee_language or "fi"
    return labels[key][preferred_language]


def create_verkkokauppa_order(reservation: Reservation):
    order_params = _get_order_params(reservation)

    try:
        payment_order = create_order(order_params)
    except CreateOrderError as err:
        with push_scope() as scope:
            scope.set_extra("details", "Creating order in Verkkokauppa failed")
            scope.set_extra("reservation-id", reservation.pk)
            capture_exception(err)
        raise ValidationErrorWithCode(
            "Upstream service call failed. Unable to confirm the reservation.",
            ValidationErrorCodes.UPSTREAM_CALL_FAILED,
        ) from err
    return payment_order


def _get_order_params(reservation: Reservation):
    runit = reservation.reservation_unit.first()
    quantity = 1  # Currently, we don't support quantities larger than 1
    price_net = round_decimal(Decimal(quantity * reservation.price_net), 2)
    price_vat = round_decimal(
        Decimal(
            quantity * reservation.price_net * (reservation.tax_percentage_value / 100)
        ),
        2,
    )
    preferred_language = getattr(reservation, "reservee_language", "fi")
    items = [
        OrderItemParams(
            product_id=runit.payment_product.id,
            product_name=getattr(runit, f"name_{preferred_language}", runit.name),
            quantity=1,
            unit="pcs",
            row_price_net=price_net,
            row_price_vat=price_vat,
            row_price_total=price_net + price_vat,
            price_net=price_net,
            price_vat=price_vat,
            price_gross=price_net + price_vat,
            vat_percentage=reservation.tax_percentage_value,
            meta=[
                OrderItemMetaParams(
                    key="namespaceProductId",
                    value=runit.uuid,
                    label=None,
                    visible_in_checkout=False,
                    ordinal=0,
                ),
                OrderItemMetaParams(
                    key="reservationPeriod",
                    value=get_formatted_reservation_time(reservation),
                    label=get_meta_label("reservationPeriod", reservation),
                    visible_in_checkout=True,
                    ordinal=1,
                ),
                OrderItemMetaParams(
                    key="reservationNumber",
                    value=reservation.pk,
                    label=get_meta_label("reservationNumber", reservation),
                    visible_in_checkout=True,
                    ordinal=2,
                ),
            ],
        )
    ]
    order_params = CreateOrderParams(
        namespace=settings.VERKKOKAUPPA_NAMESPACE,
        user=reservation.user.uuid,
        language=reservation.reservee_language or "fi",
        items=items,
        price_net=sum(item.row_price_net for item in items),
        price_vat=sum(item.row_price_vat for item in items),
        price_total=sum(item.row_price_total for item in items),
        customer=OrderCustomer(
            first_name=reservation.reservee_first_name,
            last_name=reservation.reservee_last_name,
            email=reservation.reservee_email,
            phone=get_validated_phone_number(reservation.reservee_phone)
            if reservation.reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL
            else "",
        ),
        last_valid_purchase_datetime=datetime.now(tz=get_default_timezone())
        + timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES),
    )

    return order_params
