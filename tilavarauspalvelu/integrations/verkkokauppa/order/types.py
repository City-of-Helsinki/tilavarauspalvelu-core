from __future__ import annotations

import uuid
from dataclasses import dataclass
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Literal

from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import ParseOrderError
from utils.decimal_utils import round_decimal

if TYPE_CHECKING:
    import datetime


@dataclass(frozen=True)
class OrderItemMetaParams:
    key: str
    value: str
    label: str | None
    visible_in_checkout: bool | None
    ordinal: str | None


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
    meta: list[OrderItemMetaParams]


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


@dataclass(frozen=True)
class OrderCustomer:
    first_name: str
    last_name: str
    email: str
    phone: str


OrderType = Literal["subscription", "order"]


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
    status: str | None
    subscription_id: uuid.UUID | None
    type: OrderType

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
                items=[
                    OrderItem(
                        order_item_id=uuid.UUID(item["orderItemId"]),
                        order_id=uuid.UUID(item["orderId"]),
                        product_id=uuid.UUID(item["productId"]),
                        product_name=item["productName"],
                        quantity=item["quantity"],
                        unit=item["unit"],
                        row_price_net=Decimal(item["rowPriceNet"]),
                        row_price_vat=Decimal(item["rowPriceVat"]),
                        row_price_total=Decimal(item["rowPriceTotal"]),
                        price_net=Decimal(item["priceNet"]),
                        price_gross=Decimal(item["priceGross"]),
                        price_vat=Decimal(item["priceVat"]),
                        vat_percentage=Decimal(item["vatPercentage"]),
                        meta=[
                            OrderItemMeta(
                                order_item_meta_id=uuid.UUID(meta["orderItemMetaId"]),
                                order_item_id=uuid.UUID(meta["orderItemId"]),
                                order_id=uuid.UUID(meta["orderId"]),
                                key=meta["key"],
                                value=meta["value"],
                                label=meta.get("label"),
                                visible_in_checkout=meta.get("visibleInCheckout") not in {False, "false"},
                                ordinal=meta.get("ordinal"),
                            )
                            for meta in item["meta"]
                        ],
                        period_frequency=item.get("periodFrequency", None),
                        period_unit=item.get("periodUnit", None),
                        period_count=item.get("periodCount", None),
                        start_date=parse_datetime(item.get("startDate", None)),
                        billing_start_date=parse_datetime(item.get("billingStartDate", None)),
                    )
                    for item in json["items"]
                ],
                price_net=Decimal(json["priceNet"]),
                price_vat=Decimal(json["priceVat"]),
                price_total=Decimal(json["priceTotal"]),
                checkout_url=json["loggedInCheckoutUrl"] if settings.VERKKOKAUPPA_NEW_LOGIN else json["checkoutUrl"],
                receipt_url=json["receiptUrl"],
                customer=OrderCustomer(
                    first_name=json["customer"]["firstName"],
                    last_name=json["customer"]["lastName"],
                    email=json["customer"]["email"],
                    phone=json["customer"].get("phone", ""),
                ),
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
            "items": [
                {
                    "productId": str(item.product_id),
                    "productName": item.product_name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "rowPriceNet": str(item.row_price_net),
                    "rowPriceVat": str(item.row_price_vat),
                    "rowPriceTotal": str(item.row_price_total),
                    "priceNet": str(item.price_net),
                    "priceGross": str(item.price_gross),
                    "priceVat": str(item.price_vat),
                    # PayTrail supports only one number in decimal part: https://docs.paytrail.com/#/?id=item
                    "vatPercentage": str(round_decimal(item.vat_percentage, 1)),
                    "meta": [
                        {
                            "key": meta.key,
                            "value": str(meta.value),
                            "label": meta.label,
                            "visibleInCheckout": meta.visible_in_checkout,
                            "ordinal": meta.ordinal,
                        }
                        for meta in item.meta
                    ],
                }
                for item in self.items
            ],
            "priceNet": str(self.price_net),
            "priceVat": str(self.price_vat),
            "priceTotal": str(self.price_total),
            "customer": {
                "firstName": self.customer.first_name or "-",
                "lastName": self.customer.last_name or "-",
                "email": self.customer.email,
                "phone": self.customer.phone,
            },
        }
