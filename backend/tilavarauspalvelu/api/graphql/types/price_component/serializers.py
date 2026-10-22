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
    One component in a batch of changes. A component with a `pk` replaces the saved component as a whole,
    so every field must be given, also the ones that do not change.
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
        missing_fields = [field for field in ("valid_from", "amount", "price_unit") if field not in data]
        if missing_fields:
            msg = f"Price component is missing required fields: {', '.join(missing_fields)}."
            raise ValidationError(msg, code=error_codes.REQUIRED_FIELD_MISSING)
        return data
