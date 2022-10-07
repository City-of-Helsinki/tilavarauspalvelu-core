from ..exceptions import VerkkokauppaError


class PaymentError(VerkkokauppaError):
    pass


class ParsePaymentError(PaymentError):
    pass


class GetPaymentError(PaymentError):
    pass
