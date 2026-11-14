import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "SalesItemError",
    "check_sales_items_for_online_payments",
    "validate_sales_items_for_payment_type",
]


@dataclasses.dataclass(frozen=True, slots=True)
class SalesItemError:
    code: error_codes
    message: str
    components: list[PriceComponent]


def check_sales_items_for_online_payments(
    *,
    components: Iterable[PriceComponent],
    online_reservation_unit_names: list[str],
) -> list[SalesItemError]:
    """
    Check that the paid components that are active or in the future have a sales item,
    if the pricing group is used by reservation units that are paid online.
    The webshop needs the sales item for the accounting of each paid price.

    :param components: All components of one pricing group, with any unsaved changes.
    :param online_reservation_unit_names: Names of the reservation units that use the group and are paid online.
    """
    if not online_reservation_unit_names:
        return []

    today = local_date()
    missing_components = [
        component
        for component in components
        if component.amount > 0
        and component.sales_item_id is None
        and (component.valid_until is None or component.valid_until > today)
    ]
    if not missing_components:
        return []

    reservation_unit_names = ", ".join(sorted(online_reservation_unit_names))
    component_texts = ", ".join(
        f"{component.pk or 'new'} from {component.valid_from.isoformat()}" for component in missing_components
    )
    message = (
        f"Paid prices need a sales item, because these reservation units are paid online: {reservation_unit_names}. "
        f"Price components: {component_texts}."
    )
    error = SalesItemError(
        code=error_codes.PRICE_COMPONENT_SALES_ITEM_MISSING,
        message=message,
        components=missing_components,
    )
    return [error]


def validate_sales_items_for_payment_type(
    *, reservation_unit: ReservationUnit, payment_type: PaymentType | None
) -> None:
    """
    Check that the reservation unit can use the given payment type with its pricing groups.

    :raises ValidationError: If the payment type is online, and a paid component of the reservation unit's
                             active or future pricing groups has no sales item.
    """
    if payment_type not in PaymentType.requires_verkkokauppa or reservation_unit.pk is None:
        return

    today = local_date()
    rows = list(reservation_unit.reservation_unit_pricing_groups.order_by("begins"))
    past_or_active_rows = [row for row in rows if row.begins <= today]
    current_rows = past_or_active_rows[-1:] + [row for row in rows if row.begins > today]
    pricing_group_ids = {row.pricing_group_id for row in current_rows}

    components = PriceComponent.objects.filter(pricing_group_id__in=pricing_group_ids)

    errors = check_sales_items_for_online_payments(
        components=components,
        online_reservation_unit_names=[reservation_unit.name],
    )
    if errors:
        raise ValidationError(errors[0].message, code=errors[0].code)
