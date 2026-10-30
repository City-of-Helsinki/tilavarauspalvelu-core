from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.typing import error_codes

__all__ = [
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
            "can_apply_for_discount",
            "material_price_description",
            "payment_type",
            "tax_level",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if data.get("pk") is not None:
            return data

        missing_fields = [field for field in ("valid_from", "amount", "price_unit", "tax_level") if field not in data]
        if missing_fields:
            msg = f"New price component is missing required fields: {', '.join(missing_fields)}."
            raise ValidationError(msg, code=error_codes.REQUIRED_FIELD_MISSING)
        return data
