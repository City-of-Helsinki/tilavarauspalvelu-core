from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PriceComponent


__all__ = [
    "PriceComponentValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PriceComponentValidator:
    price_component: PriceComponent

    def validate_option_belongs_to_pricing_group_unit_group(self) -> None:
        option = self.price_component.price_option
        if option is None:
            return

        unit_group_id = self.price_component.pricing_group.unit_group_id
        if option.unit_group_id != unit_group_id:
            msg = "Price option must belong to the same unit group as the pricing group."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_OPTION_WRONG_UNIT_GROUP)

    def validate_option_is_active(self) -> None:
        option = self.price_component.price_option
        if option is None:
            return

        if not option.is_active:
            msg = "Price option is not active."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_OPTION_INACTIVE)
