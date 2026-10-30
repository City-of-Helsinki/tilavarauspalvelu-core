from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from collections.abc import Collection

    from tilavarauspalvelu.models import PricingGroup


__all__ = [
    "PricingGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PricingGroupValidator:
    pricing_group: PricingGroup

    def validate_own_group_has_one_reservation_unit(self, reservation_unit_ids: Collection[int]) -> None:
        if self.pricing_group.unit_group_id is not None:
            return

        if len(set(reservation_unit_ids)) > 1:
            msg = "A pricing group without a unit group can be used by only one reservation unit."
            raise ValidationError(msg, code=error_codes.PRICING_GROUP_OWN_GROUP_HAS_MANY_RESERVATION_UNITS)
