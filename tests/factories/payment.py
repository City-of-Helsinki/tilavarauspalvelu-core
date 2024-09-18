import uuid
from datetime import datetime
from decimal import Decimal

import factory
from django.utils.timezone import get_default_timezone
from factory import fuzzy

from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from tilavarauspalvelu.models import PaymentAccounting, PaymentMerchant, PaymentOrder, PaymentProduct
from tilavarauspalvelu.utils.verkkokauppa.payment.types import Payment

from ._base import GenericDjangoModelFactory, GenericFactory

__all__ = [
    "PaymentAccountingFactory",
    "PaymentFactory",
    "PaymentMerchantFactory",
    "PaymentOrderFactory",
    "PaymentProductFactory",
]


class PaymentFactory(GenericFactory[Payment]):
    class Meta:
        model = Payment

    payment_id = uuid.uuid4()
    namespace = "tilanvaraus"
    order_id = uuid.uuid4()
    user_id = uuid.uuid4()
    status = "payment_created"
    payment_method = "creditcards"
    payment_type = "order"
    total_excl_tax = Decimal("100")
    total = Decimal("124")
    tax_amount = Decimal("24")
    description = "Mock description"
    additional_info = '{"payment_method": creditcards}'
    token = uuid.uuid4()
    timestamp = datetime.now(tz=get_default_timezone())
    payment_method_label = "Visa"


class PaymentMerchantFactory(GenericDjangoModelFactory[PaymentMerchant]):
    class Meta:
        model = PaymentMerchant

    id = factory.LazyFunction(uuid.uuid4)
    name = fuzzy.FuzzyText()


class PaymentProductFactory(GenericDjangoModelFactory[PaymentProduct]):
    class Meta:
        model = PaymentProduct

    id = factory.LazyFunction(uuid.uuid4)
    merchant = factory.SubFactory("tests.factories.PaymentMerchantFactory")


class PaymentOrderFactory(GenericDjangoModelFactory[PaymentOrder]):
    class Meta:
        model = PaymentOrder

    reservation = factory.SubFactory("tests.factories.ReservationFactory")
    remote_id = factory.LazyFunction(uuid.uuid4)
    payment_id = ""  # uuid
    refund_id = None  # uuid
    payment_type = PaymentType.INVOICE
    status = OrderStatus.DRAFT
    price_net = Decimal("10.0")
    price_vat = Decimal("2.0")
    price_total = Decimal("12.0")
    processed_at = None
    language = Language.FI


class PaymentAccountingFactory(GenericDjangoModelFactory[PaymentAccounting]):
    class Meta:
        model = PaymentAccounting

    name = fuzzy.FuzzyText()
    company_code = "1234"
    main_ledger_account = "123456"
    vat_code = "AB"
    internal_order = "1234567890"
    profit_center = "1234567"
    project = "1234567"
    operation_area = "123456"
    balance_profit_center = "2983300"
