from undine import Order, OrderSet

from tilavarauspalvelu.models import TermsOfUse

__all__ = [
    "TermsOfUseOrderSet",
]


class TermsOfUseOrderSet(OrderSet[TermsOfUse]):
    pk = Order()
