from typing import Any

from django.core import validators
from graphene.utils.str_converters import to_camel_case
from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.extensions.decimal_field import DecimalField
from api.graphql.extensions.duration_field import DurationField
from api.graphql.extensions.legacy_helpers import (
    OldChoiceCharField,
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
    get_all_translatable_fields,
)
from api.graphql.extensions.validating_list_field import ValidatingListField
from api.legacy_rest_api.serializers import ReservationUnitSerializer
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    PriceUnit,
    PricingStatus,
    PricingType,
    Purpose,
    Qualifier,
    ReservationKind,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    TaxPercentage,
)
from reservation_units.utils.reservation_unit_pricing_helper import ReservationUnitPricingHelper
from reservations.models import ReservationMetadataSet
from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from terms_of_use.models import TermsOfUse


class EquipmentSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=EquipmentCategory.objects.all(), source="category")

    class Meta:
        model = Equipment
        fields = ["id", "name", "category_id"]


class EquipmentCreateSerializer(EquipmentSerializer, OldPrimaryKeySerializer):
    category_pk = IntegerPrimaryKeyField(queryset=EquipmentCategory.objects.all(), source="category")

    class Meta(EquipmentSerializer.Meta):
        fields = [
            "pk",
            "category_pk",
        ] + get_all_translatable_fields(EquipmentSerializer.Meta.model)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise GraphQLError("nameFi is required.")

        return data


class EquipmentUpdateSerializer(OldPrimaryKeyUpdateSerializer, EquipmentCreateSerializer):
    class Meta(EquipmentCreateSerializer.Meta):
        fields = EquipmentCreateSerializer.Meta.fields + ["pk"]


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "id",
            "name",
        ]


class EquipmentCategoryCreateSerializer(EquipmentCategorySerializer, OldPrimaryKeySerializer):
    class Meta(EquipmentCategorySerializer.Meta):
        fields = ["pk"] + get_all_translatable_fields(EquipmentSerializer.Meta.model)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise GraphQLError("nameFi is required.")

        return data


class EquipmentCategoryUpdateSerializer(OldPrimaryKeyUpdateSerializer, EquipmentCategoryCreateSerializer):
    class Meta(EquipmentCategoryCreateSerializer.Meta):
        fields = EquipmentCategoryCreateSerializer.Meta.fields + ["pk"]


class PurposeCreateSerializer(OldPrimaryKeySerializer):
    class Meta:
        model = Purpose
        fields = get_all_translatable_fields(model)


class PurposeUpdateSerializer(OldPrimaryKeyUpdateSerializer, PurposeCreateSerializer):
    class Meta(PurposeCreateSerializer.Meta):
        fields = ["pk"] + PurposeCreateSerializer.Meta.fields


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
    lowest_price_net = DecimalField(default=0)
    highest_price = DecimalField(default=0)
    highest_price_net = DecimalField(default=0)

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


class ReservationUnitCreateSerializer(ReservationUnitSerializer, OldPrimaryKeySerializer):
    terms_of_use_fi = serializers.CharField(required=False, allow_null=True)
    terms_of_use_sv = serializers.CharField(required=False, allow_null=True)
    terms_of_use_en = serializers.CharField(required=False, allow_null=True)
    name_fi = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name_sv = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    name_en = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    max_reservation_duration = DurationField(required=False, allow_null=True)
    min_reservation_duration = DurationField(required=False, allow_null=True)
    buffer_time_before = DurationField(required=False, allow_null=True)
    buffer_time_after = DurationField(required=False, allow_null=True)
    max_persons = serializers.IntegerField(required=False, allow_null=True)
    space_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Space.objects.all()),
        source="spaces",
        required=False,
    )
    resource_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Resource.objects.all()),
        source="resources",
        required=False,
    )
    purpose_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Purpose.objects.all()),
        source="purposes",
        required=False,
    )
    qualifier_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Qualifier.objects.all()),
        source="qualifiers",
        required=False,
    )
    equipment_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Equipment.objects.all()),
        source="equipments",
        required=False,
    )
    service_pks = serializers.ListField(
        child=IntegerPrimaryKeyField(queryset=Service.objects.all()),
        source="services",
        required=False,
    )
    reservation_unit_type_pk = IntegerPrimaryKeyField(
        source="reservation_unit_type",
        required=False,
        allow_null=True,
        queryset=ReservationUnitType.objects.all(),
    )
    unit_pk = IntegerPrimaryKeyField(
        queryset=Unit.objects.all(),
        source="unit",
        required=False,
        allow_null=True,
    )
    cancellation_rule_pk = IntegerPrimaryKeyField(
        queryset=ReservationUnitCancellationRule.objects.all(),
        source="cancellation_rule",
        required=False,
        allow_null=True,
    )
    payment_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT),
        source="payment_terms",
        required=False,
        allow_null=True,
    )
    pricing_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_PRICING),
        source="pricing_terms",
        required=False,
        allow_null=True,
    )
    cancellation_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION),
        source="cancellation_terms",
        required=False,
        allow_null=True,
    )
    service_specific_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_SERVICE),
        source="service_specific_terms",
        required=False,
        allow_null=True,
    )
    reservation_start_interval = OldChoiceCharField(
        required=False,
        choices=ReservationUnit.RESERVATION_START_INTERVAL_CHOICES,
        help_text=(
            "Determines the interval for the start time of the reservation. "
            "For example an interval of 15 minutes means a reservation can "
            "begin at minutes 0, 15, 30, or 45. Possible values are "
            f"{', '.join(value[0].upper() for value in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES)}."
        ),
    )
    metadata_set_pk = IntegerPrimaryKeyField(
        queryset=ReservationMetadataSet.objects.all(),
        source="metadata_set",
        required=False,
        allow_null=True,
    )
    authentication = OldChoiceCharField(
        required=False,
        choices=ReservationUnit.AUTHENTICATION_TYPES,
        help_text=(
            "Authentication required for reserving this reservation unit. Possible values are "
            f"{', '.join(value[0].upper() for value in ReservationUnit.AUTHENTICATION_TYPES)}."
        ),
    )

    reservation_kind = OldChoiceCharField(
        default=ReservationKind.DIRECT_AND_SEASON,
        choices=ReservationKind.choices,
        help_text=(
            "What kind of reservations are to be made to this is reservation unit. Possible values are: "
            f"{', '.join(value.upper() for value in ReservationKind)}."
        ),
    )

    allow_reservations_without_opening_hours = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Allow reservations without opening hours. Used for testing.",
    )

    is_archived = serializers.BooleanField(required=False, default=False, help_text="Is reservation unit archived")

    payment_types = ValidatingListField(
        child=serializers.PrimaryKeyRelatedField(queryset=ReservationUnitPaymentType.objects.all()),
        allow_empty=True,
        required=False,
    )

    pricings = ReservationUnitPricingCreateSerializer(many=True, read_only=False, required=False)

    translation_fields = get_all_translatable_fields(ReservationUnit)

    class Meta(ReservationUnitSerializer.Meta):
        fields = [
            "pk",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "images",
            "location",
            "max_persons",
            "min_persons",
            "reservation_unit_type",
            "building",
            "equipment_pks",
            "unit_pk",
            "uuid",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "space_pks",
            "resource_pks",
            "purpose_pks",
            "qualifier_pks",
            "service_pks",
            "reservation_unit_type_pk",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "cancellation_rule_pk",
            "payment_terms_pk",
            "cancellation_terms_pk",
            "service_specific_terms_pk",
            "reservation_start_interval",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set_pk",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "reservation_kind",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "pricing_terms_pk",
            "pricing_terms",
            "payment_types",
            "pricings",
        ] + get_all_translatable_fields(ReservationUnit)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["equipment_pks"].write_only = True
        self.fields["space_pks"].write_only = True
        self.fields["resource_pks"].write_only = True
        self.fields["purpose_pks"].write_only = True
        self.fields["service_pks"].write_only = True
        self.fields["payment_terms_pk"].write_only = True
        self.fields["cancellation_terms_pk"].write_only = True
        self.fields["service_specific_terms_pk"].write_only = True
        self.fields["pricing_terms_pk"].write_only = True
        self.fields["metadata_set_pk"].write_only = True

    def _check_pk_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise GraphQLError(f"Wrong type of id: {identifier} for {field_name}")

    def validate(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))
        data = self.validate_pricing_fields(data)

        if not is_draft:
            self.validate_for_publish(data)

        if "name_fi" in data:
            name = data.get("name_fi")
            if not name or name.isspace():
                raise GraphQLError("nameFi is required for draft reservation units.")

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published reservation unit."""
        allowed_empty_fields = [
            "reservation_confirmed_instructions_fi",
            "reservation_confirmed_instructions_sv",
            "reservation_confirmed_instructions_en",
            "reservation_pending_instructions_fi",
            "reservation_pending_instructions_sv",
            "reservation_pending_instructions_en",
            "reservation_cancelled_instructions_fi",
            "reservation_cancelled_instructions_sv",
            "reservation_cancelled_instructions_en",
            "terms_of_use_fi",
            "terms_of_use_en",
            "terms_of_use_sv",
        ]
        for field in self.translation_fields:
            value = data.get(field, getattr(self.instance, field, None))
            if field not in allowed_empty_fields and (not value or value.isspace()):
                raise GraphQLError(
                    f"Not draft state reservation units must have a translations. "
                    f"Missing translation for {to_camel_case(field)}."
                )

        spaces = data.get("spaces", getattr(self.instance, "spaces", None))
        resources = data.get("resources", getattr(self.instance, "resources", None))
        if not (spaces or resources):
            raise GraphQLError("Not draft state reservation unit must have one or more space or resource defined")

        reservation_unit_type = data.get(
            "reservation_unit_type",
            getattr(self.instance, "reservation_unit_type", None),
        )
        if not reservation_unit_type:
            raise GraphQLError("Not draft reservation unit must have a reservation unit type.")

        max_persons = data.get("max_persons", getattr(self.instance, "max_persons", None))
        if data.get("min_persons") and max_persons and data.get("min_persons") > max_persons:
            raise GraphQLError("minPersons can't be more than maxPersons")

    def validate_pricing_fields(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))

        ReservationUnitPricingHelper.check_pricing_required(is_draft, data)
        ReservationUnitPricingHelper.check_pricing_dates(data)
        ReservationUnitPricingHelper.check_pricing_counts(is_draft, data)
        data["pricings"] = ReservationUnitPricingHelper.calculate_vat_prices(data)

        return data

    @staticmethod
    def handle_pricings(pricings: list[dict[Any, Any]], reservation_unit):
        for pricing in pricings:
            ReservationUnitPricing.objects.create(**pricing, reservation_unit=reservation_unit)

    def create(self, validated_data):
        pricings = validated_data.pop("pricings", [])
        reservation_unit = super().create(validated_data)
        self.handle_pricings(pricings, reservation_unit)
        return reservation_unit


class ReservationUnitUpdateSerializer(OldPrimaryKeyUpdateSerializer, ReservationUnitCreateSerializer):
    pricings = ReservationUnitPricingUpdateSerializer(many=True, read_only=False, required=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["unit_pk"].required = False
        self.fields["pricings"].write_only = True

    class Meta(ReservationUnitCreateSerializer.Meta):
        fields = ReservationUnitCreateSerializer.Meta.fields + ["pk"]

    def validate(self, data):
        data = super().validate(data)
        self.validate_pricing(data)
        return data

    def validate_pricing(self, data) -> dict[str, Any]:
        current_active_pricing = ReservationUnitPricingHelper.get_active_price(self.instance)
        current_future_pricing = ReservationUnitPricingHelper.get_future_price(self.instance)

        for pricing in data.get("pricings"):
            if (
                ReservationUnitPricingHelper.is_active(pricing)
                and current_active_pricing
                and current_active_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("ACTIVE pricing is already defined. Only one ACTIVE pricing is allowed")
            elif (
                ReservationUnitPricingHelper.is_future(pricing)
                and current_future_pricing
                and current_future_pricing.pk != pricing.get("pk", 0)
            ):
                raise GraphQLError("FUTURE pricing is already defined. Only one FUTURE pricing is allowed")

        data = ReservationUnitPricingHelper.calculate_vat_prices(data)
        return data

    @staticmethod
    def handle_pricings(pricings: list[dict[Any, Any]], reservation_unit):
        # Delete pricings that are not in the payload
        if not ReservationUnitPricingHelper.contains_status(PricingStatus.PRICING_STATUS_ACTIVE, pricings):
            ReservationUnitPricing.objects.filter(
                reservation_unit=reservation_unit,
                status=PricingStatus.PRICING_STATUS_ACTIVE,
            ).delete()
        if not ReservationUnitPricingHelper.contains_status(PricingStatus.PRICING_STATUS_FUTURE, pricings):
            ReservationUnitPricing.objects.filter(
                reservation_unit=reservation_unit,
                status=PricingStatus.PRICING_STATUS_FUTURE,
            ).delete()

        for pricing in pricings:
            if "pk" in pricing:  # Update existing pricings
                ReservationUnitPricing.objects.update_or_create(pk=pricing["pk"], defaults=pricing)
            else:  # Create new pricings
                status = pricing.get("status")
                ReservationUnitPricing.objects.filter(reservation_unit=reservation_unit, status=status).delete()
                ReservationUnitPricing.objects.create(**pricing, reservation_unit=reservation_unit)

    def update(self, instance, validated_data):
        pricings = validated_data.pop("pricings", [])
        reservation_unit = super().update(instance, validated_data)
        self.handle_pricings(pricings, instance)
        return reservation_unit


class ReservationUnitImageCreateSerializer(OldPrimaryKeySerializer):
    reservation_unit_pk = IntegerPrimaryKeyField(queryset=ReservationUnit.objects.all(), source="reservation_unit")
    image_type = serializers.CharField(
        help_text="Type of image. Value is one of image_type enum values: "
        f"{', '.join(value[0].upper() for value in ReservationUnitImage.TYPES)}.",
        required=True,
    )

    class Meta:
        model = ReservationUnitImage
        fields = ["pk", "reservation_unit_pk", "image_type"]

    def validate_image_field(self, image):
        image_field = serializers.ImageField(
            source="image",
            required=True,
            validators=[validators.validate_image_file_extension],
        )
        image_field.run_validators(image)

    def validate_image_type(self, type):
        return type.lower()

    def validate(self, data):
        image = self.context.get("request").FILES.get("image")
        if not image:
            raise GraphQLError("No image file in request")
        try:
            self.validate_image_field(image)

            type_field = serializers.ChoiceField(choices=ReservationUnitImage.TYPES)
            type_field.run_validation(data["image_type"])

        except serializers.ValidationError as e:
            raise self.validation_error_to_graphql_error(e)

        data["image"] = image

        return data


class ReservationUnitImageUpdateSerializer(OldPrimaryKeyUpdateSerializer):
    reservation_unit_pk = IntegerPrimaryKeyField(
        source="reservation_unit",
        read_only=True,
    )
    image_type = OldChoiceCharField(
        required=False,
        choices=ReservationUnitImage.TYPES,
        help_text=(
            "Type of image. Value is one of image_type enum values: "
            f"{', '.join(value[0].upper() for value in ReservationUnitImage.TYPES)}."
        ),
    )

    class Meta:
        model = ReservationUnitImage
        fields = ["pk", "reservation_unit_pk", "image_type"]