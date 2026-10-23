from __future__ import annotations

from decimal import Decimal
from typing import Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.typing import error_codes

__all__ = [
    "OwnPricingInputSerializer",
    "PriceComponentInputSerializer",
]


class PriceComponentInputSerializer(NestingModelSerializer):
    """
    One component in a batch of changes. A component with a `pk` updates a saved component.
    Its fields that are left out keep their saved values. A component without a `pk` is new.
    """

    class Meta:
        model = PriceComponent
        fields = [
            "pk",
            "valid_from",
            "valid_until",
            "price_option",
            "amount",
            "price_unit",
            "accounting",
            "can_apply_for_discount",
            "material_price_description",
            "payment_type",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if data.get("pk") is not None:
            return data

        missing_fields = [field for field in ("valid_from", "amount", "price_unit") if field not in data]
        if missing_fields:
            msg = f"New price component is missing required fields: {', '.join(missing_fields)}."
            raise ValidationError(msg, code=error_codes.REQUIRED_FIELD_MISSING)
        return data


class OwnPricingInputSerializer(serializers.Serializer):
    """
    One pricing of a reservation unit's own pricing group. It lasts until the next pricing begins.
    The pricings must include the active pricing and all future pricings.
    """

    pk = serializers.IntegerField(required=False, allow_null=True)
    begins = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal(0))
    price_unit = EnumFriendlyChoiceField(choices=PriceUnit.choices, enum=PriceUnit)
    payment_type = EnumFriendlyChoiceField(
        choices=PaymentType.choices,
        enum=PaymentType,
        required=False,
        allow_null=True,
    )
    can_apply_for_discount = serializers.BooleanField(required=False)
    material_price_description_fi = serializers.CharField(required=False, allow_blank=True)
    material_price_description_en = serializers.CharField(required=False, allow_blank=True)
    material_price_description_sv = serializers.CharField(required=False, allow_blank=True)
