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

        saved_component_queryset = PriceComponent.objects.filter(pricing_group=instance)
        saved_components = {component.pk: component for component in saved_component_queryset}

        components: list[PriceComponent] = []
        for data in component_data:
            saved_component = saved_components.get(data.get("pk"))

            # A field that is left out of an update keeps its saved value.
            if saved_component is not None:
                component = PriceComponent(
                    pk=saved_component.pk,
                    pricing_group=instance,
                    kind=saved_component.kind,
                    valid_from=data.get("valid_from", saved_component.valid_from),
                    valid_until=data.get("valid_until", saved_component.valid_until),
                    price_option=data.get("price_option", saved_component.price_option),
                    amount=data.get("amount", saved_component.amount),
                    price_unit=data.get("price_unit", saved_component.price_unit),
                    can_apply_for_discount=data.get("can_apply_for_discount", saved_component.can_apply_for_discount),
                    material_price_description_fi=data.get(
                        "material_price_description_fi",
                        saved_component.material_price_description_fi,
                    ),
                    material_price_description_en=data.get(
                        "material_price_description_en",
                        saved_component.material_price_description_en,
                    ),
                    material_price_description_sv=data.get(
                        "material_price_description_sv",
                        saved_component.material_price_description_sv,
                    ),
                    payment_type=data.get("payment_type", saved_component.payment_type),
                )

            else:
                component = PriceComponent(
                    pk=data.get("pk"),
                    pricing_group=instance,
                    kind=PriceComponentKind.BASE,
                    valid_from=data.get("valid_from"),
                    valid_until=data.get("valid_until"),
                    price_option=data.get("price_option"),
                    amount=data.get("amount"),
                    price_unit=data.get("price_unit"),
                    can_apply_for_discount=data.get("can_apply_for_discount", False),
                    material_price_description_fi=data.get("material_price_description_fi", ""),
                    material_price_description_en=data.get("material_price_description_en", ""),
                    material_price_description_sv=data.get("material_price_description_sv", ""),
                    payment_type=data.get("payment_type"),
                )

            components.append(component)

        save_price_component_changes(
            pricing_group=instance,
            components=components,
            deleted_component_pks=deleted_component_pks,
        )
        return instance
