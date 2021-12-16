from django.core import validators
from graphene.utils.str_converters import to_camel_case
from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.translate_fields import get_all_translatable_fields
from api.reservation_units_api import (
    EquipmentCategorySerializer,
    EquipmentSerializer,
    ReservationUnitSerializer,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitType,
    TaxPercentage,
)
from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from terms_of_use.models import TermsOfUse


class EquipmentCreateSerializer(EquipmentSerializer, PrimaryKeySerializer):
    category_pk = IntegerPrimaryKeyField(
        queryset=EquipmentCategory.objects.all(), source="category"
    )

    class Meta(EquipmentSerializer.Meta):
        fields = [
            "pk",
            "category_pk",
        ] + get_all_translatable_fields(EquipmentSerializer.Meta.model)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise serializers.ValidationError("nameFi is required.")

        return data


class EquipmentUpdateSerializer(PrimaryKeyUpdateSerializer, EquipmentCreateSerializer):
    class Meta(EquipmentCreateSerializer.Meta):
        fields = EquipmentCreateSerializer.Meta.fields + ["pk"]


class EquipmentCategoryCreateSerializer(
    EquipmentCategorySerializer, PrimaryKeySerializer
):
    class Meta(EquipmentCategorySerializer.Meta):
        fields = ["pk"] + get_all_translatable_fields(EquipmentSerializer.Meta.model)

    def validate(self, data):
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name_fi:
            raise serializers.ValidationError("nameFi is required.")

        return data


class EquipmentCategoryUpdateSerializer(
    PrimaryKeyUpdateSerializer, EquipmentCategoryCreateSerializer
):
    class Meta(EquipmentCategoryCreateSerializer.Meta):
        fields = EquipmentCategoryCreateSerializer.Meta.fields + ["pk"]


class PurposeCreateSerializer(PrimaryKeySerializer):
    class Meta:
        model = Purpose
        fields = get_all_translatable_fields(model)


class PurposeUpdateSerializer(PrimaryKeyUpdateSerializer, PurposeCreateSerializer):
    class Meta(PurposeCreateSerializer.Meta):
        fields = ["pk"] + PurposeCreateSerializer.Meta.fields


class ReservationUnitCreateSerializer(ReservationUnitSerializer, PrimaryKeySerializer):
    terms_of_use_fi = serializers.CharField(required=False)
    terms_of_use_sv = serializers.CharField(required=False)
    terms_of_use_en = serializers.CharField(required=False)
    name_fi = serializers.CharField(required=False, allow_blank=True)
    name_sv = serializers.CharField(required=False, allow_blank=True)
    name_en = serializers.CharField(required=False, allow_blank=True)
    max_reservation_duration = serializers.DurationField(required=False)
    min_reservation_duration = serializers.DurationField(required=False)
    max_persons = serializers.IntegerField(required=False)
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
        queryset=ReservationUnitType.objects.all(),
    )
    unit_pk = IntegerPrimaryKeyField(queryset=Unit.objects.all(), source="unit")
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
    )
    cancellation_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(
            terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        ),
        source="cancellation_terms",
        required=False,
    )
    service_specific_terms_pk = serializers.PrimaryKeyRelatedField(
        queryset=TermsOfUse.objects.filter(terms_type=TermsOfUse.TERMS_TYPE_SERVICE),
        source="service_specific_terms",
        required=False,
    )
    lowest_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Minimum price of the reservation unit",
    )
    highest_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Maximum price of the reservation unit",
    )
    price_unit = serializers.CharField(
        required=False,
        help_text=(
            "Unit of the price. "
            f"Possible values are {', '.join(value for value, _ in ReservationUnit.PRICE_UNITS)}."
        ),
    )
    reservation_start_interval = serializers.CharField(
        required=False,
        help_text=(
            "Determines the interval for the start time of the reservation. "
            "For example an interval of 15 minutes means a reservation can "
            "begin at minutes 0, 15, 30, or 45. Possible values are "
            f"{', '.join(value[0] for value in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES)}."
        ),
    )
    tax_percentage_pk = IntegerPrimaryKeyField(
        queryset=TaxPercentage.objects.all(),
        source="tax_percentage",
        required=False,
    )

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
            "reservation_unit_type",
            "building",
            "equipment_pks",
            "unit_pk",
            "uuid",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "space_pks",
            "resource_pks",
            "purpose_pks",
            "service_pks",
            "reservation_unit_type_pk",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "cancellation_rule_pk",
            "payment_terms_pk",
            "cancellation_terms_pk",
            "service_specific_terms_pk",
            "lowest_price",
            "highest_price",
            "price_unit",
            "reservation_start_interval",
            "tax_percentage_pk",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
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
        self.fields["tax_percentage_pk"].write_only = True

    def _check_pk_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise serializers.ValidationError(
                    f"Wrong type of id: {identifier} for {field_name}"
                )

    def validate_price_unit(self, value):
        valid_values = [x[0] for x in ReservationUnit.PRICE_UNITS]
        if value not in valid_values:
            raise serializers.ValidationError(
                f"Invalid price unit {value}. Valid values are {', '.join(valid_values)}"
            )
        return value

    def validate_reservation_start_interval(self, value):
        valid_values = [
            x[0] for x in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES
        ]
        if value not in valid_values:
            raise serializers.ValidationError(
                f"Invalid reservation start interval {value}. Valid values are {', '.join(valid_values)}"
            )
        return value

    def validate(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))

        if not is_draft:
            self.validate_for_publish(data)

        if "name_fi" in data.keys():
            name = data.get("name_fi")
            if not name or name.isspace():
                raise serializers.ValidationError(
                    "nameFi is required for draft reservation units."
                )

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published reservation unit."""
        allowed_empty_fields = [
            "additional_instructions_fi",
            "additional_instructions_sv",
            "additional_instructions_en",
        ]
        for field in self.translation_fields:
            value = data.get(field, getattr(self.instance, field, None))
            if field not in allowed_empty_fields and (not value or value.isspace()):
                raise serializers.ValidationError(
                    f"Not draft state reservation units must have a translations. "
                    f"Missing translation for {to_camel_case(field)}."
                )

        spaces = data.get("spaces", getattr(self.instance, "spaces", None))
        resources = data.get("resources", getattr(self.instance, "resources", None))
        if not (spaces or resources):
            raise serializers.ValidationError(
                "Not draft state reservation unit must have one or more space or resource defined"
            )

        reservation_unit_type = data.get(
            "reservation_unit_type",
            getattr(self.instance, "reservation_unit_type", None),
        )
        if not reservation_unit_type:
            raise serializers.ValidationError(
                "Not draft reservation unit must have a reservation unit type."
            )


class ReservationUnitUpdateSerializer(
    PrimaryKeyUpdateSerializer, ReservationUnitCreateSerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["unit_pk"].required = False

    class Meta(ReservationUnitCreateSerializer.Meta):
        fields = ReservationUnitCreateSerializer.Meta.fields + ["pk"]


class ReservationUnitImageCreateSerializer(PrimaryKeySerializer):
    reservation_unit_pk = IntegerPrimaryKeyField(
        queryset=ReservationUnit.objects.all(), source="reservation_unit"
    )
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
            raise serializers.ValidationError("No image file in request")
        self.validate_image_field(image)

        type_field = serializers.ChoiceField(choices=ReservationUnitImage.TYPES)
        type_field.run_validation(data["image_type"])

        data["image"] = image

        return data
