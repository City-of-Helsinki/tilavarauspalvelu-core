from undine import Order, OrderSet

from tilavarauspalvelu.models import TaxPercentage

__all__ = [
    "TaxPercentageOrderSet",
]


class TaxPercentageOrderSet(OrderSet[TaxPercentage]):
    pk = Order()
