from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import PriceComponentKind
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

    # These match the check constraints of the model, so that a batch save does not need a query for each one.

    def validate_sales_item_matches_tax_level(self) -> None:
        sales_item = self.price_component.sales_item
        if sales_item is not None and sales_item.tax_level_id != self.price_component.tax_level_id:
            msg = "The tax level of the sales item must be the same as the tax level of the price component."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_SALES_ITEM_TAX_LEVEL_MISMATCH)

    def validate_amount_not_negative(self) -> None:
        if self.price_component.amount < 0:
            msg = "Amount cannot be negative."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_AMOUNT_NEGATIVE)

    def validate_discount_only_when_paid(self) -> None:
        component = self.price_component
        if component.kind == PriceComponentKind.BASE and component.can_apply_for_discount and component.amount <= 0:
            msg = "A free base component cannot allow applying for a discount."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_DISCOUNT_WHEN_FREE)

    def validate_valid_from_before_valid_until(self) -> None:
        valid_until = self.price_component.valid_until
        if valid_until is not None and self.price_component.valid_from >= valid_until:
            msg = "Valid from must be before valid until."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_VALID_UNTIL_NOT_AFTER_VALID_FROM)

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

    def validate_new_begins_in_future(self, *, has_saved_components: bool) -> None:
        # The first prices of a new pricing group can begin in the past.
        if not has_saved_components:
            return

        valid_from = self.price_component.valid_from
        if valid_from <= local_date():
            msg = f"New price component must begin after today, not on {valid_from.isoformat()}."
            raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_VALID_FROM_NOT_IN_FUTURE)

    def validate_change(self, changed_component: PriceComponent) -> None:
        today = local_date()
        saved_component = self.price_component
        is_past = saved_component.valid_until is not None and saved_component.valid_until <= today
        is_active = not is_past and saved_component.valid_from <= today

        changed_field_names = _get_changed_field_names(
            saved_component=saved_component,
            changed_component=changed_component,
        )

        if is_past:
            if changed_field_names:
                msg = f"Price component {saved_component.pk} is in the past and cannot be changed."
                raise ValidationError(msg, code=error_codes.PRICE_COMPONENT_PAST_CHANGED)
            return

        if is_active:
            if changed_field_names - {"valid_until"}:
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


def _get_changed_field_names(*, saved_component: PriceComponent, changed_component: PriceComponent) -> set[str]:
    return {
        field.name
        for field in saved_component._meta.concrete_fields
        if field.value_from_object(saved_component) != field.value_from_object(changed_component)
    }
