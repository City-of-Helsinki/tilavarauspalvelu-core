from decimal import Decimal
from uuid import uuid4

from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText

from merchants.models import Language, OrderStatus, PaymentType


class PaymentMerchantFactory(DjangoModelFactory):
    class Meta:
        model = "merchants.PaymentMerchant"

    id = uuid4()
    name = FuzzyText()


class PaymentProductFactory(DjangoModelFactory):
    class Meta:
        model = "merchants.PaymentProduct"

    id = uuid4()
    merchant = SubFactory(PaymentMerchantFactory)

    @post_generation
    def merchant(self, create, merchant, **kwargs):
        if not create or not merchant:
            return

        self.merchant = merchant


class PaymentOrderFactory(DjangoModelFactory):
    class Meta:
        model = "merchants.PaymentOrder"

    price_net = Decimal("10.0")
    price_vat = Decimal("2.0")
    price_total = Decimal("12.0")
    payment_type = PaymentType.INVOICE
    status = OrderStatus.DRAFT
    language = Language.FI


class PaymentAccountingFactory(DjangoModelFactory):
    class Meta:
        model = "merchants.PaymentAccounting"

    company_code = "1234"
    main_ledger_account = "123456"
    vat_code = "AB"
    internal_order = "1234567890"
    profit_center = "1234567"
    project = "1234567"
    operation_area = "123456"
