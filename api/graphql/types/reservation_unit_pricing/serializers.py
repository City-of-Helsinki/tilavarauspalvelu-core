from api.graphql.extensions.decimal_field import DecimalField
from api.graphql.extensions.legacy_helpers import (
    OldChoiceCharField,
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
)
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.enums import PriceUnit, PricingStatus, PricingType
from reservation_units.models import ReservationUnitPricing, TaxPercentage


class ReservationUnitPricingCreateSerializer(OldPrimaryKeySerializer):
    pricing_type = OldChoiceCharField(
        required=True,
        choices=PricingType.choices,
        help_text=(
            "What kind of pricing type this pricing has. Possible values are "
            f"{', '.join(value.upper() for value in PricingType)}."
        ),
    )
    price_unit = OldChoiceCharField(
        required=False,
        choices=PriceUnit.choices,
        help_text=(
            f"Unit of the price. Possible values are {', '.join(value[0].upper() for value in PriceUnit.choices)}."
        ),
    )

    tax_percentage_pk = IntegerPrimaryKeyField(
        queryset=TaxPercentage.objects.all(),
        source="tax_percentage",
        required=False,
    )

    status = OldChoiceCharField(
        required=True,
        choices=PricingStatus.choices,
        help_text=(
            f"Pricing status. Possible values are {', '.join(value[0].upper() for value in PricingStatus.choices)}."
        ),
    )

    lowest_price = DecimalField(default=0)
    highest_price = DecimalField(default=0)

    lowest_price_net = DecimalField(default=0, read_only=True)
    highest_price_net = DecimalField(default=0, read_only=True)

    class Meta:
        model = ReservationUnitPricing
        fields = [
            "begins",
            "pricing_type",
            "price_unit",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage_pk",
            "status",
        ]


class ReservationUnitPricingUpdateSerializer(OldPrimaryKeyUpdateSerializer, ReservationUnitPricingCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].required = False

    class Meta(ReservationUnitPricingCreateSerializer.Meta):
        fields = ["pk"] + ReservationUnitPricingCreateSerializer.Meta.fields
