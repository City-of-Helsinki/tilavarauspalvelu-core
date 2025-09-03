from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import ReservationUnitPricing


class ReservationUnitPricingSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "is_activated_on_begins",
            "payment_type",
            "price_unit",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage",
            "material_price_description_fi",
            "material_price_description_en",
            "material_price_description_sv",
        ]
        extra_kwargs = {
            "lowest_price_net": {"read_only": True},
            "highest_price_net": {"read_only": True},
        }
