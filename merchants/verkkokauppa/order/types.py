from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID

from ..helpers import parse_datetime
from .exceptions import ParseOrderError


@dataclass(frozen=True)
class OrderItemMetaParams:
    key: str
    value: str
    label: Optional[str]
    visible_in_checkout: Optional[bool]
    ordinal: Optional[str]


@dataclass(frozen=True)
class OrderItemMeta:
    order_item_meta_id: UUID
    order_item_id: UUID
    order_id: UUID
    key: str
    value: str
    label: Optional[str]
    visible_in_checkout: Optional[bool]
    ordinal: Optional[str]


@dataclass(frozen=True)
class OrderItemParams:
    product_id: UUID
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
    meta: List[OrderItemMetaParams]


@dataclass(frozen=True)
class OrderItem:
    order_item_id: UUID
    order_id: UUID
    product_id: UUID
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
    meta: List[OrderItemMeta]
    period_frequency: Optional[int]
    period_unit: Optional[str]
    period_count: Optional[int]
    start_date: Optional[datetime]
    billing_start_date: Optional[datetime]


@dataclass(frozen=True)
class OrderCustomer:
    first_name: str
    last_name: str
    email: str
    phone: str


OrderType = Literal["subscription", "order"]


@dataclass(frozen=True)
class Order:
    order_id: UUID
    namespace: str
    user: str
    created_at: datetime
    items: List[OrderItem]
    price_net: Optional[Decimal]
    price_vat: Optional[Decimal]
    price_total: Optional[Decimal]
    checkout_url: Optional[str]
    customer: Optional[OrderCustomer]
    status: Optional[str]
    subscription_id: Optional[UUID]
    type: OrderType

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Order":
        try:
            return Order(
                order_id=UUID(json["orderId"]),
                namespace=json["namespace"],
                user=json["user"],
                created_at=parse_datetime(json["createdAt"]),
                items=[
                    OrderItem(
                        order_item_id=UUID(item["orderItemId"]),
                        order_id=UUID(item["orderId"]),
                        product_id=UUID(item["productId"]),
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
                                order_item_meta_id=UUID(meta["orderItemMetaId"]),
                                order_item_id=UUID(meta["orderItemId"]),
                                order_id=UUID(meta["orderId"]),
                                key=meta["key"],
                                value=meta["value"],
                                label=meta["label"],
                                visible_in_checkout=meta["visibleInCheckout"]
                                not in [False, "false"],
                                ordinal=meta["ordinal"],
                            )
                            for meta in item["meta"]
                        ],
                        period_frequency=item.get("periodFrequency", None),
                        period_unit=item.get("periodUnit", None),
                        period_count=item.get("periodCount", None),
                        start_date=parse_datetime(item.get("startDate", None)),
                        billing_start_date=parse_datetime(
                            item.get("billingStartDate", None)
                        ),
                    )
                    for item in json["items"]
                ],
                price_net=Decimal(json["priceNet"]),
                price_vat=Decimal(json["priceVat"]),
                price_total=Decimal(json["priceTotal"]),
                checkout_url=json["checkoutUrl"],
                customer=OrderCustomer(
                    first_name=json["customer"]["firstName"],
                    last_name=json["customer"]["lastName"],
                    email=json["customer"]["email"],
                    phone=json["customer"]["phone"],
                ),
                status=json["status"],
                subscription_id=UUID(json["subscriptionId"])
                if json["subscriptionId"]
                else None,
                type=json["type"],
            )
        except (KeyError, ValueError) as e:
            raise ParseOrderError("Could not parse order") from e


@dataclass(frozen=True)
class CreateOrderParams:
    namespace: str
    user: str
    items: List[OrderItemParams]
    customer: OrderCustomer

    def to_json(self) -> Dict[str, Any]:
        return {
            "namespace": self.namespace,
            "user": self.user,
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
                    "vatPercentage": str(item.vat_percentage),
                    "meta": [
                        {
                            "key": meta.key,
                            "value": meta.value,
                            "label": meta.label,
                            "visibleInCheckout": meta.visible_in_checkout,
                            "ordinal": meta.ordinal,
                        }
                        for meta in item.meta
                    ],
                }
                for item in self.items
            ],
            "customer": {
                "firstName": self.customer.first_name,
                "lastName": self.customer.last_name,
                "email": self.customer.email,
                "phone": self.customer.phone,
            },
        }
