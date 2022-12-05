from ..exceptions import VerkkokauppaError


class OrderError(VerkkokauppaError):
    pass


class CreateOrderError(OrderError):
    pass


class ParseOrderError(OrderError):
    pass


class GetOrderError(OrderError):
    pass


class CancelOrderError(OrderError):
    pass
