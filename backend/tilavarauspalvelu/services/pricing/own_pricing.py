from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.db import transaction
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import PriceComponentKind
from tilavarauspalvelu.models import PriceComponent, PricingGroup, ReservationUnitPricingGroup
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

from .changes import save_price_component_changes

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from tilavarauspalvelu.enums import PaymentType, PriceUnit
    from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "OwnPricing",
    "save_own_pricings",
]


@dataclasses.dataclass(frozen=True, slots=True)
class OwnPricing:
    pk: int | None
    begins: datetime.date
    amount: Decimal
    price_unit: PriceUnit
    payment_type: PaymentType | None
    can_apply_for_discount: bool
    material_price_description_fi: str
    material_price_description_en: str
    material_price_description_sv: str


def save_own_pricings(*, reservation_unit: ReservationUnit, pricings: list[OwnPricing]) -> None:
    """
    Save the active and future pricings of a reservation unit to its own pricing group.

    Each pricing is one base component that lasts until the next pricing begins.
    Future components that are not in the given pricings are deleted.
    If the reservation unit has no pricing group yet, an own group is made from the first pricing onward.

    :raises ValidationError: If the reservation unit uses a shared pricing group, or if the changes are not valid.
    """
    if not pricings:
        return

    sorted_pricings = sorted(pricings, key=lambda pricing: pricing.begins)
    today = local_date()

    with transaction.atomic():
        pricing_group = _own_pricing_group(reservation_unit=reservation_unit, today=today)
        if pricing_group is None:
            pricing_group = PricingGroup.objects.create(
                name=reservation_unit.name,
                name_fi=reservation_unit.name_fi,
                name_en=reservation_unit.name_en,
                name_sv=reservation_unit.name_sv,
                unit_group=None,
            )
            ReservationUnitPricingGroup.objects.create(
                reservation_unit=reservation_unit,
                pricing_group=pricing_group,
                begins=sorted_pricings[0].begins,
            )

        valid_until_dates = [pricing.begins for pricing in sorted_pricings[1:]] + [None]
        components = [
            PriceComponent(
                pk=pricing.pk,
                pricing_group=pricing_group,
                kind=PriceComponentKind.BASE,
                valid_from=pricing.begins,
                valid_until=valid_until,
                price_option=None,
                amount=pricing.amount,
                price_unit=pricing.price_unit,
                accounting=None,
                can_apply_for_discount=pricing.can_apply_for_discount,
                material_price_description_fi=pricing.material_price_description_fi,
                material_price_description_en=pricing.material_price_description_en,
                material_price_description_sv=pricing.material_price_description_sv,
                payment_type=pricing.payment_type,
            )
            for pricing, valid_until in zip(sorted_pricings, valid_until_dates, strict=True)
        ]

        given_pks = {pricing.pk for pricing in sorted_pricings if pricing.pk is not None}
        deleted_component_pks = list(
            PriceComponent.objects
            .filter(pricing_group=pricing_group, valid_from__gt=today)
            .exclude(pk__in=given_pks)
            .values_list("pk", flat=True)
        )

        save_price_component_changes(
            pricing_group=pricing_group,
            components=components,
            deleted_component_pks=deleted_component_pks,
        )


# Internals


def _own_pricing_group(*, reservation_unit: ReservationUnit, today: datetime.date) -> PricingGroup | None:
    """
    Find the own pricing group from the active and future pricing group rows of the reservation unit.

    :raises ValidationError: If any of these rows uses a shared pricing group,
                             or if another reservation unit also uses the own pricing group.
    """
    rows = list(
        ReservationUnitPricingGroup.objects
        .filter(reservation_unit=reservation_unit)
        .select_related("pricing_group")
        .order_by("begins")
    )
    past_rows = [row for row in rows if row.begins <= today]
    future_rows = [row for row in rows if row.begins > today]
    current_and_future_rows = [*past_rows[-1:], *future_rows]

    if any(row.pricing_group.unit_group_id is not None for row in current_and_future_rows):
        msg = "Reservation unit uses a shared pricing group. Its prices cannot be set here."
        raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_USES_SHARED_PRICING_GROUP)

    if not current_and_future_rows:
        return None

    pricing_group = current_and_future_rows[0].pricing_group
    reservation_unit_ids = list(
        ReservationUnitPricingGroup.objects.filter(pricing_group=pricing_group).values_list(
            "reservation_unit_id", flat=True
        )
    )
    pricing_group.validators.validate_own_group_has_one_reservation_unit(reservation_unit_ids)
    return pricing_group
