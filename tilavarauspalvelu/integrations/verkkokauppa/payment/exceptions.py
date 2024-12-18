from __future__ import annotations

from tilavarauspalvelu.integrations.verkkokauppa.exceptions import VerkkokauppaError


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


class GetRefundStatusError(PaymentError):
    pass


class ParseRefundStatusError(PaymentError):
    pass
