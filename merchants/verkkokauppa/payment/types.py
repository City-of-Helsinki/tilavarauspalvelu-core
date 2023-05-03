from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from sentry_sdk import capture_exception, push_scope

from ..payment.exceptions import (
    ParsePaymentError,
    ParseRefundError,
    ParseRefundStatusError,
)


class PaymentStatus(Enum):
    """
    Source:
    https://github.com/City-of-Helsinki/verkkokauppa-core/blob/master/
    paymentapi/src/main/java/fi/hel/verkkokauppa/payment/model/PaymentStatus.java
    """

    CREATED = "payment_created"
    PAID_ONLINE = "payment_paid_online"
    CANCELLED = "payment_cancelled"
    AUTHORIZED = "authorized"


class RefundStatus(Enum):
    CREATED = "refund_created"
    PAID_ONLINE = "refund_paid_online"
    CANCELLED = "refund_cancelled"


@dataclass(frozen=True)
class Payment:
    payment_id: str
    namespace: str
    order_id: UUID
    user_id: str
    status: str
    payment_method: str
    payment_type: str
    total_excl_tax: Decimal
    total: Decimal
    tax_amount: Decimal
    description: Optional[str]
    additional_info: str
    token: str
    timestamp: datetime
    payment_method_label: str

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Payment":
        try:
            return Payment(
                payment_id=json["paymentId"],
                namespace=json["namespace"],
                order_id=UUID(json["orderId"]),
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
            )
        except (KeyError, ValueError) as e:
            raise ParsePaymentError("Could not parse payment") from e

    @classmethod
    def _parse_datetime(cls, string: str) -> datetime:
        return datetime.strptime(string, "%Y%m%d-%H%M%S")


@dataclass(frozen=True)
class Refund:
    refund_id: UUID
    order_id: UUID
    namespace: str
    user: str
    created_at: datetime
    status: str
    customer_first_name: Optional[str]
    customer_last_name: Optional[str]
    customer_email: Optional[str]
    customer_phone: Optional[str]
    refund_reason: Optional[str]

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "Refund":
        from ..helpers import parse_datetime

        try:
            return Refund(
                refund_id=UUID(json["refundId"]),
                order_id=UUID(json["orderId"]),
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
            with push_scope() as scope:
                scope.set_extra("details", "Parsing refund failed")
                scope.set_extra("json", json)
                capture_exception(err)
            raise ParseRefundError(f"Could not parse refund: {str(err)}") from err


@dataclass(frozen=True)
class RefundStatusResult:
    order_id: UUID
    refund_payment_id: str
    refund_transaction_id: UUID
    namespace: str
    status: str
    created_at: datetime

    @classmethod
    def from_json(cls, json: Dict[str, Any]) -> "RefundStatusResult":
        from ..helpers import parse_datetime

        try:
            return RefundStatusResult(
                order_id=UUID(json["orderId"]),
                refund_payment_id=json["refundPaymentId"],
                refund_transaction_id=UUID(json["refundTransactionId"]),
                namespace=json["namespace"],
                status=json["status"],
                created_at=parse_datetime(json["createdAt"]),
            )
        except (KeyError, ValueError) as err:
            with push_scope() as scope:
                scope.set_extra("details", "Parsing refund status failed")
                scope.set_extra("json", json)
                capture_exception(err)
            raise ParseRefundStatusError(
                f"Could not parse refund status: {str(err)}"
            ) from err
