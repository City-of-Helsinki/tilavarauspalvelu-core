from tilavarauspalvelu.models import PaymentAccounting, PaymentMerchant


class ReservationUnitPaymentHelper:
    @classmethod
    def get_merchant(cls, reservation_unit) -> PaymentMerchant | None:
        if reservation_unit.payment_merchant is not None:
            return reservation_unit.payment_merchant
        if reservation_unit.unit and reservation_unit.unit.payment_merchant is not None:
            return reservation_unit.unit.payment_merchant

        return None

    @classmethod
    def requires_product_mapping_update(cls, reservation_unit) -> bool:
        from tilavarauspalvelu.enums import PricingStatus, PricingType

        payment_merchant = cls.get_merchant(reservation_unit)
        if payment_merchant is None:
            return False
        if reservation_unit.payment_product is not None:
            return True
        if reservation_unit.is_draft:
            return False
        return (
            reservation_unit.pricings.filter(pricing_type=PricingType.PAID)
            .exclude(status=PricingStatus.PRICING_STATUS_PAST)
            .exists()
        )

    @classmethod
    def get_accounting(cls, reservation_unit) -> PaymentAccounting | None:
        if reservation_unit.payment_accounting is not None:
            return reservation_unit.payment_accounting
        if reservation_unit.unit:
            return reservation_unit.unit.payment_accounting
        return None
