from uuid import uuid4

from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


class PaymentMerchantFactory(DjangoModelFactory):
    class Meta:
        model = "merchants.PaymentMerchant"

    id = uuid4()
    name = FuzzyText()
