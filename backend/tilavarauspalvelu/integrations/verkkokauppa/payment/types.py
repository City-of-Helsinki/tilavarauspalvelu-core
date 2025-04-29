from __future__ import annotations

import datetime
import uuid
from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum
from typing import Any

from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import (
    ParsePaymentError,
    ParseRefundError,
    ParseRefundStatusError,
)


class WebShopPaymentStatus(StrEnum):
    """
    Source:
    https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/paymentapi/src/main/java/fi/hel/verkkokauppa/payment/model/PaymentStatus.java
    """

    CREATED = "payment_created"
    PAID_ONLINE = "payment_paid_online"
    CANCELLED = "payment_cancelled"

    # Not currently used:
    INVOICE = "payment_invoice"  # Not for invoicing -> determined by 'WebShopPaymentGateway'
    AUTHORIZED = "authorized"
    CREATED_FOR_MIT_CHARGE = "payment_created_for_mit_charge"
    FREE = "payment_free"


class WebShopPaymentGateway(StrEnum):
    """
    Source:
    https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/paymentapi/src/main/java/fi/hel/verkkokauppa/payment/constant/PaymentGatewayEnum.java
    """

    PAYTRAIL = "online-paytrail"
    INVOICE = "offline"

    # Not currently used:
    VISMA = "online"
    FREE = "free"


class WebShopRefundStatus(StrEnum):
    """
    Source:
    https://github.com/City-of-Helsinki/verkkokauppa-core/blob/7186e76040ed51f2b5322287eee85022dc80181a/paymentapi/src/main/java/fi/hel/verkkokauppa/payment/model/refund/RefundPaymentStatus.java
    """

    CREATED = "refund_created"
    PAID_ONLINE = "refund_paid_online"
    CANCELLED = "refund_cancelled"


@dataclass(frozen=True)
class Payment:
    payment_id: str
    namespace: str
    order_id: uuid.UUID
    user_id: str
    status: str  # Don's use 'WebShopPaymentStatus' here so that new statuses don't break out code
    payment_method: str
    payment_type: str
    total_excl_tax: Decimal
    total: Decimal
    tax_amount: Decimal
    description: str | None
    additional_info: str
    token: str
    timestamp: datetime.datetime  # When Payment was created in the webshop, usually later than PaymentOrder.created_at
    payment_method_label: str
    payment_gateway: str  # Don't use 'WebShopPaymentGateway' here so that new gateways don't break out code

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> Payment:
        try:
            return Payment(
                payment_id=json["paymentId"],
                namespace=json["namespace"],
                order_id=uuid.UUID(json["orderId"]),
                user_id=json["userId"],
                status=json["status"],
                payment_method=json["paymentMethod"],
                payment_type=json["paymentType"],
                total_excl_tax=Decimal(str(json["totalExclTax"])),
                total=Decimal(str(json["total"])),
                tax_amount=Decimal(str(json["taxAmount"])),
                description=json["description"],
                additional_info=json["additionalInfo"],
                token=json["token"],
                timestamp=cls._parse_datetime(json["timestamp"]),
                payment_method_label=json["paymentMethodLabel"],
                payment_gateway=json["paymentGateway"],
            )
        except (KeyError, ValueError) as err:
            SentryLogger.log_exception(err, details="Parsing refund failed", json=json)
            msg = f"Could not parse payment: {err!s}"
            raise ParsePaymentError(msg) from err

    @classmethod
    def _parse_datetime(cls, string: str) -> datetime.datetime:
        return datetime.datetime.strptime(string, "%Y%m%d-%H%M%S").astimezone(settings.VERKKOKAUPPA_TIMEZONE)


@dataclass(frozen=True)
class Refund:
    refund_id: uuid.UUID
    order_id: uuid.UUID
    namespace: str
    user: str
    created_at: datetime.datetime
    status: str
    customer_first_name: str | None
    customer_last_name: str | None
    customer_email: str | None
    customer_phone: str | None
    refund_reason: str | None

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> Refund:
        from tilavarauspalvelu.integrations.verkkokauppa.helpers import parse_datetime

        try:
            return Refund(
                refund_id=uuid.UUID(json["refundId"]),
                order_id=uuid.UUID(json["orderId"]),
                namespace=json["namespace"],
                user=json["user"],
                created_at=parse_datetime(json["createdAt"]),
                status=json["status"],
                customer_first_name=json.get("customerFirstName"),
                customer_last_name=json.get("customerLastName"),
                customer_email=json.get("customerEmail"),
                customer_phone=json.get("customerPhone"),
                refund_reason=json.get("refundReason"),
            )
        except (KeyError, ValueError) as err:
            SentryLogger.log_exception(err, details="Parsing refund failed", json=json)
            msg = f"Could not parse refund: {err!s}"
            raise ParseRefundError(msg) from err


@dataclass(frozen=True)
class RefundStatusResult:
    order_id: uuid.UUID
    refund_payment_id: str
    refund_transaction_id: uuid.UUID
    namespace: str
    status: str  # Don't use 'WebShopRefundStatus' here so that new statuses don't break out code
    created_at: datetime.datetime

    @classmethod
    def from_json(cls, json: dict[str, Any]) -> RefundStatusResult:
        from tilavarauspalvelu.integrations.verkkokauppa.helpers import parse_datetime

        try:
            return RefundStatusResult(
                order_id=uuid.UUID(json["orderId"]),
                refund_payment_id=json["refundPaymentId"],
                refund_transaction_id=uuid.UUID(json["refundTransactionId"]),
                namespace=json["namespace"],
                status=json["status"],
                created_at=parse_datetime(json["createdAt"]),
            )
        except (KeyError, ValueError) as err:
            SentryLogger.log_exception(err, details="Parsing refund status failed", json=json)
            msg = f"Could not parse refund status: {err!s}"
            raise ParseRefundStatusError(msg) from err
