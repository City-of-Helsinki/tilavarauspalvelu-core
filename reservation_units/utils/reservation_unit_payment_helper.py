from typing import TYPE_CHECKING

from common.date_utils import local_date
from merchants.models import PaymentAccounting, PaymentMerchant

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit


class ReservationUnitPaymentHelper:
    @classmethod
    def get_merchant(cls, reservation_unit: "ReservationUnit") -> PaymentMerchant | None:
        if reservation_unit.payment_merchant is not None:
            return reservation_unit.payment_merchant
        if reservation_unit.unit and reservation_unit.unit.payment_merchant is not None:
            return reservation_unit.unit.payment_merchant

        return None

    @classmethod
    def requires_product_mapping_update(cls, reservation_unit: "ReservationUnit") -> bool:
        payment_merchant = cls.get_merchant(reservation_unit)
        if payment_merchant is None:
            return False
        if reservation_unit.payment_product is not None:
            return True
        if reservation_unit.is_draft:
            return False

        # Has PAID active or future pricings
        active_pricing = reservation_unit.actions.get_active_pricing()
        if active_pricing.highest_price > 0:
            return True
        return reservation_unit.pricings.filter(highest_price__gt=0, begins__gt=local_date()).exists()

    @classmethod
    def get_accounting(cls, reservation_unit: "ReservationUnit") -> PaymentAccounting | None:
        if reservation_unit.payment_accounting is not None:
            return reservation_unit.payment_accounting
        if reservation_unit.unit:
            return reservation_unit.unit.payment_accounting
        return None
