from uuid import uuid4

from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


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
