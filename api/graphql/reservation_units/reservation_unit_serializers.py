from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.translate_fields import get_all_translatable_fields
from api.reservation_units_api import (
    EquipmentCategorySerializer,
    EquipmentSerializer,
    ReservationUnitSerializer,
)
from reservation_units.models import (
    Equipment,
    Purpose,
    ReservationUnit,
    ReservationUnitType,
)
from resources.models import Resource
from services.models import Service
from spaces.models import Space


class EquipmentCreateSerializer(EquipmentSerializer, PrimaryKeySerializer):
    class Meta(EquipmentSerializer.Meta):
        fields = ["id", "name_fi", "name_sv", "name_en", "category_id"]

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
        fields = [
            "id",
            "name_fi",
            "name_en",
            "name_en",
        ]

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


class PurposeUpdateSerializer(PurposeCreateSerializer):
    class Meta(PurposeCreateSerializer.Meta):
        fields = ["pk"] + get_all_translatable_fields(
            PurposeCreateSerializer.Meta.model
        )


class ReservationUnitCreateSerializer(ReservationUnitSerializer, PrimaryKeySerializer):
    terms_of_use = serializers.CharField(required=False)
    name_fi = serializers.CharField(required=False, allow_blank=True)
    name_sv = serializers.CharField(required=False, allow_blank=True)
    name_en = serializers.CharField(required=False, allow_blank=True)
    max_reservation_duration = serializers.DurationField(required=False)
    min_reservation_duration = serializers.DurationField(required=False)
    max_persons = serializers.IntegerField(required=False)
    space_ids = serializers.ListField(source="spaces", required=False)
    resource_ids = serializers.ListField(source="resources", required=False)
    purpose_ids = serializers.ListField(source="purposes", required=False)
    equipment_ids = serializers.ListField(source="equipments", required=False)
    service_ids = serializers.ListField(source="services", required=False)
    reservation_unit_type_id = serializers.PrimaryKeyRelatedField(
        source="reservation_unit_type",
        required=False,
        queryset=ReservationUnitType.objects.all(),
    )

    translation_fields = [
        "name_fi",
        "name_en",
        "name_sv",
        "description_fi",
        "description_en",
        "description_sv",
    ]

    class Meta(ReservationUnitSerializer.Meta):
        fields = [
            "id",
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
            "terms_of_use",
            "equipment_ids",
            "unit_id",
            "uuid",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "space_ids",
            "resource_ids",
            "purpose_ids",
            "service_ids",
            "reservation_unit_type_id",
            "surface_area",
            "buffer_time_between_reservations",
        ] + get_all_translatable_fields(ReservationUnit)

    def _check_id_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise serializers.ValidationError(
                    f"Wrong type of id: {identifier} for {field_name}"
                )

    def validate(self, data):
        is_draft = data.get("is_draft", getattr(self.instance, "is_draft", False))

        if not is_draft:
            self.validate_for_publish(data)

        if "name" in data.keys():
            name = data.get("name")
            if not name or name.isspace():
                raise serializers.ValidationError(
                    "nameFi (or name) is required for draft reservation units."
                )
        if "name_fi" in data.keys():
            name = data.get("name_fi")
            if not name or name.isspace():
                raise serializers.ValidationError(
                    "nameFi (or name) is required for draft reservation units."
                )

        return data

    def validate_space_ids(self, data):
        self._check_id_list(data, "space_ids")
        spaces = Space.objects.filter(id__in=data)
        return spaces

    def validate_resource_ids(self, data):
        self._check_id_list(data, "resource_ids")
        resources = Resource.objects.filter(id__in=data)
        return resources

    def validate_purpose_ids(self, data):
        self._check_id_list(data, "purpose_ids")
        purposes = Purpose.objects.filter(id__in=data)
        return purposes

    def validate_equipment_ids(self, data):
        self._check_id_list(data, "equipment_ids")
        equipments = Equipment.objects.filter(id__in=data)
        return equipments

    def validate_service_ids(self, data):
        self._check_id_list(data, "service_ids")
        services = Service.objects.filter(id__in=data)
        return services

    def validate_for_publish(self, data):
        """Validates necessary fields for published reservation unit."""
        for field in self.translation_fields:
            value = data.get(field, getattr(self.instance, field, None))
            if not value or value.isspace():
                raise serializers.ValidationError(
                    f"Not draft state reservation units must have a translations. Missing translation for {field}."
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
        self.fields["unit_id"].required = False

    class Meta(ReservationUnitCreateSerializer.Meta):
        fields = ReservationUnitCreateSerializer.Meta.fields + ["pk"]
