import re
from datetime import datetime
from typing import Optional

from django.conf import settings
from sentry_sdk import capture_message

from api.graphql.application_errors import ValidationErrorCodes, ValidationErrorWithCode
from applications.models import CUSTOMER_TYPES
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


def parse_datetime(string: Optional[str]) -> Optional[datetime]:
    if string is None:
        return None
    return datetime.strptime(string, "%Y-%m-%dT%H:%M:%S.%f")


def get_formatted_reservation_time(reservation: Reservation) -> str:
    """
    Weekday is localized based on user's preferred language, but rest
    of the format is always the same: ww dd.mm.yyyy hh:mm-hh:mm
    """
    preferred_language = reservation.user.preferred_language or "fi"
    weekday = localized_short_weekday(reservation.begin.weekday(), preferred_language)
    end_time = reservation.end.strftime("%H:%M")
    return reservation.begin.strftime(f"{weekday} %d.%m.%Y %H:%M-{end_time}")


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


def create_verkkokauppa_order(reservation: Reservation):
    runit = reservation.reservation_unit.first()
    quantity = 1  # Currently, we don't support quantities larger than 1
    price_net = quantity * reservation.price_net
    price_vat = (
        quantity * reservation.price_net * (reservation.tax_percentage_value / 100)
    )
    preferred_language = getattr(reservation, "preferred_language", "fi")
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
                    label="Varausaika",
                    visible_in_checkout=True,
                    ordinal=1,
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
            first_name="First",
            last_name="Name",
            email="asdasd@asdasd.fi",
            phone=get_validated_phone_number(reservation.reservee_phone)
            if reservation.reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL
            else "",
        ),
    )

    try:
        payment_order = create_order(order_params)
    except (CreateOrderError) as e:
        capture_message(
            f"Call to Verkkokauppa Order Experience API failed: {e}",
            level="error",
        )
        raise ValidationErrorWithCode(
            "Upstream service call failed. Unable to confirm the reservation.",
            ValidationErrorCodes.UPSTREAM_CALL_FAILED,
        )
    return payment_order
