from undine import Order, OrderSet

from tilavarauspalvelu.models import ApplicationRound

__all__ = [
    "ApplicationRoundOrderSet",
]


class ApplicationRoundOrderSet(OrderSet[ApplicationRound]):
    pk = Order()
