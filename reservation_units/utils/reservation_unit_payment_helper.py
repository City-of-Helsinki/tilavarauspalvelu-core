from typing import Optional

from merchants.models import PaymentMerchant


class ReservationUnitPaymentHelper:
    @classmethod
    def get_merchant(cls, reservation_unit) -> Optional[PaymentMerchant]:
        if reservation_unit.payment_merchant is not None:
            return reservation_unit.payment_merchant
        if reservation_unit.unit and reservation_unit.unit.payment_merchant is not None:
            return reservation_unit.unit.payment_merchant

        return None

    @classmethod
    def requires_product_mapping_update(cls, reservation_unit) -> bool:
        from reservation_units.models import PricingStatus, PricingType

        payment_merchant = cls.get_merchant(reservation_unit)
        if payment_merchant is None:
            return False

        if reservation_unit.payment_product is not None or (
            not reservation_unit.is_draft
            and reservation_unit.pricings.filter(pricing_type=PricingType.PAID)
            .exclude(status=PricingStatus.PRICING_STATUS_PAST)
            .exists()
        ):
            return True

        return False
