from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice

from ..models import Order, OrderLine, Product


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order

    state = FuzzyChoice([state for state, _ in Order.STATE_CHOICES])


class OrderLineFactory(DjangoModelFactory):
    class Meta:
        model = OrderLine
