from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers

from tilavarauspalvelu.api.graphql.types.price_component.serializers import PriceComponentInputSerializer
from tilavarauspalvelu.enums import PriceComponentKind
from tilavarauspalvelu.models import PriceComponent, PricingGroup
from tilavarauspalvelu.services.pricing.changes import save_price_component_changes

__all__ = [
    "PricingGroupComponentsSerializer",
]


class PricingGroupComponentsSerializer(NestingModelSerializer):
    """Change the components of a pricing group as one batch."""

    instance: PricingGroup

    components = PriceComponentInputSerializer(many=True, required=False)
    deleted_components = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
    )

    class Meta:
        model = PricingGroup
        fields = [
            "pk",
            "components",
            "deleted_components",
        ]

    def update(self, instance: PricingGroup, validated_data: dict[str, Any]) -> PricingGroup:
        component_data: list[dict[str, Any]] = validated_data.pop("components", [])
        deleted_component_pks: list[int] = validated_data.pop("deleted_components", [])

        components = [
            PriceComponent(
                pk=data.get("pk"),
                pricing_group=instance,
                kind=PriceComponentKind.BASE,
                valid_from=data["valid_from"],
                valid_until=data.get("valid_until"),
                price_option=data.get("price_option"),
                amount=data["amount"],
                price_unit=data["price_unit"],
                accounting=data.get("accounting"),
                can_apply_for_discount=data.get("can_apply_for_discount", False),
                material_price_description_fi=data.get("material_price_description_fi", ""),
                material_price_description_en=data.get("material_price_description_en", ""),
                material_price_description_sv=data.get("material_price_description_sv", ""),
                payment_type=data.get("payment_type"),
            )
            for data in component_data
        ]

        save_price_component_changes(
            pricing_group=instance,
            components=components,
            deleted_component_pks=deleted_component_pks,
        )
        return instance
