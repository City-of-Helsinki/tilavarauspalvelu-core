from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Optional
from uuid import UUID

from ..payment.exceptions import ParsePaymentError


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
