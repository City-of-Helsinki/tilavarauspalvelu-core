from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.urls import reverse

from tilavarauspalvelu.integrations.verkkokauppa.exceptions import UnsupportedMetaKeyError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import (
    CreateOrderParams,
    Order,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
    WebShopOrderStatus,
)
from tilavarauspalvelu.models import PaymentMerchant, PaymentProduct
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, localized_short_weekday

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation, ReservationUnit


def parse_datetime(string: str | None) -> datetime.datetime | None:
    if string is None:
        return None

    return datetime.datetime.fromisoformat(string).astimezone(settings.VERKKOKAUPPA_TIMEZONE)


def get_formatted_reservation_time(reservation: Reservation) -> str:
    """
    Weekday is localized based on user's preferred language, but rest
    of the format is always the same: ww dd.mm.yyyy hh:mm-hh:mm
    """
    begin = reservation.begins_at.astimezone(DEFAULT_TIMEZONE)
    end = reservation.ends_at.astimezone(DEFAULT_TIMEZONE)

    preferred_language = reservation.user.get_preferred_language()
    weekday = localized_short_weekday(begin.weekday(), preferred_language)
    date = f"{begin.day}.{begin.month}.{begin.year}"
    start_time = begin.strftime("%H:%M")
    end_time = end.strftime("%H:%M")

    return begin.strftime(f"{weekday} {date} {start_time}-{end_time}")


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
        msg = f"Invalid meta label key '{key}'"
        raise UnsupportedMetaKeyError(msg)

    preferred_language = reservation.user.get_preferred_language()
    return labels[key][preferred_language]


def get_verkkokauppa_order_params(
    reservation: Reservation,
    *,
    invoicing_date: datetime.date | None = None,
) -> CreateOrderParams:
    reservation_unit: ReservationUnit = reservation.reservation_unit
    preferred_language = reservation.user.get_preferred_language()
    items = [
        OrderItemParams(
            product_id=reservation_unit.payment_product.id,
            product_name=getattr(reservation_unit, f"name_{preferred_language}", reservation_unit.name),
            quantity=1,  # Currently, we don't support quantities larger than 1
            unit="pcs",
            row_price_net=reservation.price_net,
            row_price_vat=reservation.price_vat_amount,
            row_price_total=reservation.price,
            price_net=reservation.price_net,
            price_vat=reservation.price_vat_amount,
            price_gross=reservation.price,
            vat_percentage=reservation.tax_percentage_value,
            invoicing_date=invoicing_date,
            meta=[
                OrderItemMetaParams(
                    key="namespaceProductId",
                    value=str(reservation_unit.ext_uuid),
                    label=None,
                    visible_in_checkout=False,
                    ordinal="0",
                ),
                OrderItemMetaParams(
                    key="reservationPeriod",
                    value=get_formatted_reservation_time(reservation),
                    label=get_meta_label("reservationPeriod", reservation),
                    visible_in_checkout=True,
                    ordinal="1",
                ),
                OrderItemMetaParams(
                    key="reservationNumber",
                    value=reservation.pk,
                    label=get_meta_label("reservationNumber", reservation),
                    visible_in_checkout=True,
                    ordinal="2",
                ),
            ],
        )
    ]
    return CreateOrderParams(
        namespace=settings.VERKKOKAUPPA_NAMESPACE,
        user=reservation.user.uuid,
        language=reservation.user.get_preferred_language(),
        items=items,
        price_net=Decimal(sum(item.row_price_net for item in items)),
        price_vat=Decimal(sum(item.row_price_vat for item in items)),
        price_total=Decimal(sum(item.row_price_total for item in items)),
        customer=OrderCustomer(
            first_name=reservation.user.first_name,
            last_name=reservation.user.last_name,
            email=reservation.user.email,
            phone="",
        ),
        last_valid_purchase_datetime=(
            local_datetime() + datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        ),
    )


def create_mock_verkkokauppa_order(reservation: Reservation) -> Order:
    reservation_unit: ReservationUnit = reservation.reservation_unit

    if reservation_unit.payment_product is None:
        payment_merchant = reservation_unit.actions.get_merchant()
        if payment_merchant is None:
            payment_merchant = PaymentMerchant.objects.create(id=uuid.uuid4(), name="MOCK VERKKOKAUPPA MERCHANT")
            reservation_unit.payment_merchant = payment_merchant

        payment_product = PaymentProduct.objects.create(id=uuid.uuid4(), merchant=payment_merchant)
        reservation_unit.payment_product = payment_product
        reservation_unit.save()

    order_uuid = uuid.uuid4()

    # Assume that the first URL in CORS_ALLOWED_ORIGINS is the backend URL
    base_url = settings.MOCK_VERKKOKAUPPA_BACKEND_URL.strip("/")
    # Reservation URI in the django admin
    mock_verkkokauppa_checkout_url = reverse("mock_verkkokauppa:checkout", args=[order_uuid]).strip("/")
    admin_url = reverse("admin:tilavarauspalvelu_reservation_change", args=[reservation.id]).strip("/")

    return Order(
        order_id=order_uuid,
        namespace=settings.VERKKOKAUPPA_NAMESPACE,
        user="test-user",
        created_at=local_datetime(),
        items=[],
        price_net=reservation.price_net,
        price_vat=reservation.price_vat_amount,
        price_total=reservation.price,
        customer=OrderCustomer(
            first_name=reservation.user.first_name,
            last_name=reservation.user.last_name,
            email=reservation.user.email,
            phone="",
        ),
        status=WebShopOrderStatus.DRAFT,
        subscription_id=None,
        type="order",
        checkout_url=f"{base_url}/{mock_verkkokauppa_checkout_url}/",
        receipt_url=f"{base_url}/{admin_url}/?",
    )
