from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

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

    def validate_change(self, changed_component: PriceComponent) -> None:
        today = local_date()
        saved_component = self.price_component
        is_past = saved_component.valid_until is not None and saved_component.valid_until <= today
        is_active = not is_past and saved_component.valid_from <= today

        if is_past:
            if _has_changes(saved_component=saved_component, changed_component=changed_component):
                msg = f"Price component {saved_component.pk} is in the past and cannot be changed."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_PAST_CHANGED)
            return

        if is_active:
            if _has_changes_other_than_valid_until(
                saved_component=saved_component,
                changed_component=changed_component,
            ):
                msg = f"Price component {saved_component.pk} is active. Only its end date can be changed."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_ACTIVE_CHANGED)

            valid_until = changed_component.valid_until
            if valid_until != saved_component.valid_until and valid_until is not None and valid_until <= today:
                msg = f"End date of price component {saved_component.pk} must be after today."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_VALID_UNTIL_NOT_IN_FUTURE)
            return

        if changed_component.valid_from <= today:
            msg = f"Price component {saved_component.pk} must begin after today."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_VALID_FROM_NOT_IN_FUTURE)

    def validate_can_delete(self) -> None:
        today = local_date()
        saved_component = self.price_component

        is_past = saved_component.valid_until is not None and saved_component.valid_until <= today
        if is_past:
            msg = f"Price component {saved_component.pk} is in the past and cannot be deleted."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_PAST_DELETED)

        is_active = saved_component.valid_from <= today
        if is_active:
            msg = f"Price component {saved_component.pk} is active and cannot be deleted."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_ACTIVE_DELETED)


# Internals


def _has_changes(*, saved_component: PriceComponent, changed_component: PriceComponent) -> bool:
    return saved_component.valid_until != changed_component.valid_until or _has_changes_other_than_valid_until(
        saved_component=saved_component, changed_component=changed_component
    )


def _has_changes_other_than_valid_until(*, saved_component: PriceComponent, changed_component: PriceComponent) -> bool:
    return (
        saved_component.kind != changed_component.kind
        or saved_component.valid_from != changed_component.valid_from
        or saved_component.price_option_id != changed_component.price_option_id
        or saved_component.amount != changed_component.amount
        or saved_component.price_unit != changed_component.price_unit
        or saved_component.accounting_id != changed_component.accounting_id
        or saved_component.can_apply_for_discount != changed_component.can_apply_for_discount
        or saved_component.material_price_description_fi != changed_component.material_price_description_fi
        or saved_component.material_price_description_en != changed_component.material_price_description_en
        or saved_component.material_price_description_sv != changed_component.material_price_description_sv
        or saved_component.payment_type != changed_component.payment_type
    )
