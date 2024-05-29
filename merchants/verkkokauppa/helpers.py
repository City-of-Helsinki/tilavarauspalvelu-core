import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from django.conf import settings
from django.urls import reverse
from django.utils.timezone import get_default_timezone

from common.date_utils import local_datetime
from merchants.models import PaymentMerchant, PaymentProduct
from merchants.verkkokauppa.exceptions import UnsupportedMetaKeyError
from merchants.verkkokauppa.order.types import (
    CreateOrderParams,
    Order,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
)
from reservation_units.utils.reservation_unit_payment_helper import ReservationUnitPaymentHelper
from reservations.models import Reservation
from tilavarauspalvelu.utils.date_util import localized_short_weekday
from utils.decimal_utils import round_decimal


def parse_datetime(string: str | None) -> datetime | None:
    if string is None:
        return None

    return datetime.fromisoformat(string).astimezone(settings.VERKKOKAUPPA_TIMEZONE)


def get_formatted_reservation_time(reservation: Reservation) -> str:
    """
    Weekday is localized based on user's preferred language, but rest
    of the format is always the same: ww dd.mm.yyyy hh:mm-hh:mm
    """
    begin = reservation.begin.astimezone(get_default_timezone())
    end = reservation.end.astimezone(get_default_timezone())

    preferred_language = reservation.reservee_language or "fi"
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
        raise UnsupportedMetaKeyError(f"Invalid meta label key '{key}'")

    preferred_language = reservation.reservee_language or "fi"
    return labels[key][preferred_language]


def get_verkkokauppa_order_params(reservation: Reservation) -> CreateOrderParams:
    reservation_unit = reservation.reservation_unit.first()
    quantity = 1  # Currently, we don't support quantities larger than 1
    price_net = round_decimal(Decimal(quantity * reservation.price_net), 2)
    price_vat = round_decimal(Decimal(quantity * reservation.price_net * (reservation.tax_percentage_value / 100)), 2)
    preferred_language = getattr(reservation, "reservee_language", "fi")
    items = [
        OrderItemParams(
            product_id=reservation_unit.payment_product.id,
            product_name=getattr(reservation_unit, f"name_{preferred_language}", reservation_unit.name),
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
                    value=reservation_unit.uuid,
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
        language=reservation.reservee_language or "fi",
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
            local_datetime() + timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        ),
    )


def create_mock_verkkokauppa_order(reservation: Reservation) -> Order:
    reservation_unit = reservation.reservation_unit.first()

    if reservation_unit.payment_product is None:
        payment_merchant = ReservationUnitPaymentHelper.get_merchant(reservation_unit)
        if payment_merchant is None:
            payment_merchant = PaymentMerchant.objects.create(id=uuid.uuid4(), name="MOCK VERKKOKAUPPA MERCHANT")
            reservation_unit.payment_merchant = payment_merchant

        payment_product = PaymentProduct.objects.create(id=uuid.uuid4(), merchant=payment_merchant)
        reservation_unit.payment_product = payment_product
        reservation_unit.save()

    order_uuid = uuid.uuid4()
    quantity = 1
    price_net = round_decimal(Decimal(quantity * reservation.price_net), 2)
    price_vat = round_decimal(Decimal(quantity * reservation.price_net * (reservation.tax_percentage_value / 100)), 2)

    # Assume that the first URL in CORS_ALLOWED_ORIGINS is the backend URL
    base_url = settings.MOCK_VERKKOKAUPPA_BACKEND_URL.strip("/")
    # Reservation URI in the django admin
    mock_verkkokauppa_checkout_url = reverse("mock_verkkokauppa", args=[order_uuid]).strip("/")
    admin_url = reverse("admin:reservations_reservation_change", args=[reservation.id]).strip("/")

    return Order(
        order_id=order_uuid,
        namespace=settings.VERKKOKAUPPA_NAMESPACE,
        user="test-user",
        created_at=local_datetime(),
        items=[],
        price_net=price_net,
        price_vat=price_vat,
        price_total=price_net + price_vat,
        customer=OrderCustomer(
            first_name=reservation.user.first_name,
            last_name=reservation.user.last_name,
            email=reservation.user.email,
            phone="",
        ),
        status="draft",
        subscription_id=None,
        type="order",
        checkout_url=f"{base_url}/{mock_verkkokauppa_checkout_url}/",
        receipt_url=f"{base_url}/{admin_url}/?",
    )
