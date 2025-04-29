from __future__ import annotations

import uuid
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING, Any, Literal

from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import ParseOrderError
from utils.decimal_utils import round_decimal

if TYPE_CHECKING:
    import datetime


class WebShopOrderStatus(StrEnum):
    """
    Source:
    https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/orderapi/src/main/java/fi/hel/verkkokauppa/order/model/OrderStatus.java
    """

    DRAFT = "draft"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


@dataclass(frozen=True)
class OrderItemMetaParams:
    key: str
    value: str
    label: str | None
    visible_in_checkout: bool | None
    ordinal: str | None

    def to_json(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "value": str(self.value),
            "label": self.label,
            "visibleInCheckout": self.visible_in_checkout,
            "ordinal": self.ordinal,
        }


@dataclass(frozen=True)
class OrderItemMeta:
    order_item_meta_id: uuid.UUID
    order_item_id: uuid.UUID
    order_id: uuid.UUID
    key: str
    value: str
    label: str | None
    visible_in_checkout: bool | None
    ordinal: str | None

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> OrderItemMeta:
        return OrderItemMeta(
            order_item_meta_id=uuid.UUID(data["orderItemMetaId"]),
            order_item_id=uuid.UUID(data["orderItemId"]),
            order_id=uuid.UUID(data["orderId"]),
            key=data["key"],
            value=data["value"],
            label=data.get("label"),
            visible_in_checkout=data.get("visibleInCheckout") not in {False, "false"},
            ordinal=data.get("ordinal"),
        )


@dataclass(frozen=True)
class OrderItemParams:
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit: str
    row_price_net: Decimal
    row_price_vat: Decimal
    row_price_total: Decimal
    price_net: Decimal
    price_gross: Decimal
    price_vat: Decimal
    vat_percentage: Decimal
    invoicing_date: datetime.date | None
    meta: list[OrderItemMetaParams]

    def to_json(self) -> dict[str, Any]:
        return {
            "productId": str(self.product_id),
            "productName": self.product_name,
            "quantity": self.quantity,
            "unit": self.unit,
            "rowPriceNet": str(self.row_price_net),
            "rowPriceVat": str(self.row_price_vat),
            "rowPriceTotal": str(self.row_price_total),
            "priceNet": str(self.price_net),
            "priceGross": str(self.price_gross),
            "priceVat": str(self.price_vat),
            # PayTrail supports only one number in decimal part: https://docs.paytrail.com/#/?id=item
            "vatPercentage": str(round_decimal(self.vat_percentage, 1)),
            # Including `invoicingDate` makes invoicing option available in Verkkokauppa UI
            **({"invoicingDate": self.invoicing_date.isoformat()} if self.invoicing_date else {}),
            "meta": [meta.to_json() for meta in self.meta],
        }


@dataclass(frozen=True)
class OrderItem:
    order_item_id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit: str
    row_price_net: Decimal
    row_price_vat: Decimal
    row_price_total: Decimal
    price_net: Decimal
    price_gross: Decimal
    price_vat: Decimal
    vat_percentage: Decimal
    meta: list[OrderItemMeta]
    period_frequency: int | None
    period_unit: str | None
    period_count: int | None
    start_date: datetime.datetime | None
    billing_start_date: datetime.datetime | None

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> OrderItem:
        from tilavarauspalvelu.integrations.verkkokauppa.helpers import parse_datetime

        return OrderItem(
            order_item_id=uuid.UUID(data["orderItemId"]),
            order_id=uuid.UUID(data["orderId"]),
            product_id=uuid.UUID(data["productId"]),
            product_name=data["productName"],
            quantity=data["quantity"],
            unit=data["unit"],
            row_price_net=Decimal(data["rowPriceNet"]),
            row_price_vat=Decimal(data["rowPriceVat"]),
            row_price_total=Decimal(data["rowPriceTotal"]),
            price_net=Decimal(data["priceNet"]),
            price_gross=Decimal(data["priceGross"]),
            price_vat=Decimal(data["priceVat"]),
            vat_percentage=Decimal(data["vatPercentage"]),
            meta=[OrderItemMeta.from_json(meta) for meta in data["meta"]],
            period_frequency=data.get("periodFrequency"),
            period_unit=data.get("periodUnit"),
            period_count=data.get("periodCount"),
            start_date=parse_datetime(data.get("startDate")),
            billing_start_date=parse_datetime(data.get("billingStartDate")),
        )


@dataclass(frozen=True)
class OrderCustomer:
    first_name: str
    last_name: str
    email: str
    phone: str

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> OrderCustomer:
        return OrderCustomer(
            first_name=data["firstName"],
            last_name=data["lastName"],
            email=data["email"],
            phone=data.get("phone", ""),
        )

    def to_json(self) -> dict[str, Any]:
        return {
            "firstName": self.first_name or "-",
            "lastName": self.last_name or "-",
            "email": self.email,
            "phone": self.phone,
        }


@dataclass(frozen=True)
class Order:
    order_id: uuid.UUID
    namespace: str
    user: str
    created_at: datetime.datetime
    items: list[OrderItem]
    price_net: Decimal | None
    price_vat: Decimal | None
    price_total: Decimal | None
    checkout_url: str | None
    receipt_url: str | None
    customer: OrderCustomer | None
    status: str | None  # Don's use 'WebShopOrderStatus' here so that new statuses don't break out code
    subscription_id: uuid.UUID | None
    type: Literal["subscription", "order"]

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> Order:
        from tilavarauspalvelu.integrations.verkkokauppa.helpers import parse_datetime

        subscription_id = json.get("subscriptionId")
        try:
            subscription_id = uuid.UUID(subscription_id)
        except (TypeError, ValueError):
            subscription_id = None

        try:
            return Order(
                order_id=uuid.UUID(json["orderId"]),
                namespace=json["namespace"],
                user=json["user"],
                created_at=parse_datetime(json["createdAt"]),
                items=[OrderItem.from_json(item) for item in json["items"]],
                price_net=Decimal(json["priceNet"]),
                price_vat=Decimal(json["priceVat"]),
                price_total=Decimal(json["priceTotal"]),
                checkout_url=json["loggedInCheckoutUrl"] if settings.VERKKOKAUPPA_NEW_LOGIN else json["checkoutUrl"],
                receipt_url=json["receiptUrl"],
                customer=OrderCustomer.from_json(json["customer"]),
                status=json["status"],
                subscription_id=subscription_id or None,
                type=json["type"],
            )
        except (KeyError, ValueError) as err:
            SentryLogger.log_exception(err, details="Parsing order failed", json=json)
            msg = f"Could not parse order: {err!s}"
            raise ParseOrderError(msg) from err


@dataclass(frozen=True)
class CreateOrderParams:
    namespace: str
    user: uuid.UUID
    language: str
    items: list[OrderItemParams]
    customer: OrderCustomer
    price_net: Decimal
    price_vat: Decimal
    price_total: Decimal
    last_valid_purchase_datetime: datetime.datetime

    def to_json(self) -> dict[str, Any]:
        return {
            "namespace": self.namespace,
            "user": str(self.user),
            "language": self.language,
            # Order Experience API does not support standard ISO 8601 format with UTC offset
            "lastValidPurchaseDateTime": self.last_valid_purchase_datetime.strftime("%Y-%m-%dT%H:%M:%S"),
            "items": [item.to_json() for item in self.items],
            "priceNet": str(self.price_net),
            "priceVat": str(self.price_vat),
            "priceTotal": str(self.price_total),
            "customer": self.customer.to_json(),
        }
