from ..exceptions import VerkkokauppaError


class PaymentError(VerkkokauppaError):
    pass


class ParsePaymentError(PaymentError):
    pass


class GetPaymentError(PaymentError):
    pass


class ParseRefundError(PaymentError):
    pass


class RefundPaymentError(PaymentError):
    pass
