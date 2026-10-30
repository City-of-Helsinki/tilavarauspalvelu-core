from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import ReservationPriceLine

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.services.pricing.price_lines import PriceLines
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ReservationPriceLineNode",
    "ReservationPriceType",
]


class ReservationPriceLineNode(DjangoNode):
    class Meta:
        model = ReservationPriceLine
        fields = [
            "pk",
            "description",
            "quantity",
            "price_unit",
            "unit_amount",
            "amount_before_adjustment",
            "adjustment_percentage",
            "amount",
            "override_amount",
            "tax_percentage",
        ]


class ReservationPriceCalculationLineType(graphene.ObjectType):
    description_fi = graphene.String(required=True)
    description_en = graphene.String(required=True)
    description_sv = graphene.String(required=True)
    quantity = graphene.Decimal(required=True)
    price_unit = graphene.Field(graphene.Enum.from_enum(PriceUnit), required=True)
    unit_amount = graphene.Decimal(required=True)
    amount = graphene.Decimal(required=True)
    tax_percentage = graphene.Decimal(required=True)
    material_price_description_fi = graphene.String(required=True)
    material_price_description_en = graphene.String(required=True)
    material_price_description_sv = graphene.String(required=True)

    def resolve_price_unit(root: ReservationPriceLine, info: GQLInfo) -> str:
        return PriceUnit(root.price_unit).value

    def resolve_description_fi(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.description_fi or ""

    def resolve_description_en(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.description_en or ""

    def resolve_description_sv(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.description_sv or ""

    def resolve_material_price_description_fi(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.price_component.material_price_description_fi or ""

    def resolve_material_price_description_en(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.price_component.material_price_description_en or ""

    def resolve_material_price_description_sv(root: ReservationPriceLine, info: GQLInfo) -> str:
        return root.price_component.material_price_description_sv or ""


class ReservationPriceType(graphene.ObjectType):
    lines = graphene.List(graphene.NonNull(ReservationPriceCalculationLineType), required=True)
    total = graphene.Decimal(required=True)
    can_apply_for_discount = graphene.Boolean(required=True)
    payment_type = graphene.Field(graphene.Enum.from_enum(PaymentType), required=False)

    def resolve_lines(root: PriceLines, info: GQLInfo) -> list[ReservationPriceLine]:
        return root.lines

    def resolve_total(root: PriceLines, info: GQLInfo) -> Decimal:
        return root.calculation.total

    def resolve_can_apply_for_discount(root: PriceLines, info: GQLInfo) -> bool:
        return root.calculation.can_apply_for_discount

    def resolve_payment_type(root: PriceLines, info: GQLInfo) -> str | None:
        payment_type = root.calculation.payment_type
        if payment_type is None:
            return None
        return PaymentType(payment_type).value
