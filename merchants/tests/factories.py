from decimal import Decimal
from uuid import uuid4

from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText

from merchants.models import Language, PaymentStatus, PaymentType


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
    status = PaymentStatus.DRAFT
    language = Language.FI
    customer_first_name = "First"
    customer_last_name = "Last"
    customer_email = "first.last@example.com"
