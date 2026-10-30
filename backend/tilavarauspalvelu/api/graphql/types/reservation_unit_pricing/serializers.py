from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import ReservationUnitPricing


class ReservationUnitPricingSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "payment_type",
            "price_unit",
            "lowest_price",
            "highest_price",
            "tax_level",
            "material_price_description_fi",
            "material_price_description_en",
            "material_price_description_sv",
        ]
