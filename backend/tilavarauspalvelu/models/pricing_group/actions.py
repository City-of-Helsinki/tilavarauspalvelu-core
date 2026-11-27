from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.tasks import refresh_reservation_unit_payment_products_task

if TYPE_CHECKING:
    from .model import PricingGroup


__all__ = [
    "PricingGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PricingGroupActions:
    pricing_group: PricingGroup

    def refresh_reservation_unit_payment_products(self) -> None:
        """Refresh the verkkokauppa products of every reservation unit of the group, after the commit."""
        if not settings.UPDATE_PRODUCT_MAPPING and not settings.UPDATE_ACCOUNTING:
            return

        reservation_unit_pks = (
            self.pricing_group.reservation_unit_pricing_groups
            .order_by("reservation_unit_id")
            .values_list("reservation_unit_id", flat=True)
            .distinct()
        )
        for reservation_unit_pk in reservation_unit_pks:
            refresh_reservation_unit_payment_products_task.delay_on_commit(reservation_unit_pk)
