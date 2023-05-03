from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import factory
from django.utils.timezone import get_default_timezone

from ..types import Payment

TIMEZONE = get_default_timezone()


class PaymentFactory(factory.Factory):
    class Meta:
        model = Payment

    payment_id = uuid4()
    namespace = "tilanvaraus"
    order_id = uuid4()
    user_id = uuid4()
    status = "payment_created"
    payment_method = "creditcards"
    payment_type = "order"
    total_excl_tax = Decimal("100")
    total = Decimal("124")
    tax_amount = Decimal("24")
    description = "Mock description"
    additional_info = '{"payment_method": creditcards}'
    token = uuid4()
    timestamp = datetime.now(tz=TIMEZONE)
    payment_method_label = "Visa"
