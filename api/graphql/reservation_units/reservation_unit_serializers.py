from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.reservation_units_api import (
    EquipmentCategorySerializer,
    EquipmentSerializer,
    PurposeSerializer,
    ReservationUnitSerializer,
)


class EquipmentCreateSerializer(EquipmentSerializer, PrimaryKeySerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name"].required = False

    class Meta(EquipmentSerializer.Meta):
        fields = EquipmentSerializer.Meta.fields + ["name_fi", "name_en", "name_en"]

    def validate(self, data):
        name = data.get("name", getattr(self.instance, "name", None))
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name = not name or name.isspace()
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name and no_name_fi:
            raise serializers.ValidationError("Name (or nameFi) is required.")

        return data


class EquipmentUpdateSerializer(PrimaryKeyUpdateSerializer, EquipmentCreateSerializer):
    class Meta(EquipmentCreateSerializer.Meta):
        fields = EquipmentCreateSerializer.Meta.fields + ["pk"]


class EquipmentCategoryCreateSerializer(
    EquipmentCategorySerializer, PrimaryKeySerializer
):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["name"].required = False

    class Meta(EquipmentCategorySerializer.Meta):
        fields = EquipmentCategorySerializer.Meta.fields + [
            "name_fi",
            "name_en",
            "name_en",
        ]

    def validate(self, data):
        name = data.get("name", getattr(self.instance, "name", None))
        name_fi = data.get("name_fi", getattr(self.instance, "name_fi", None))
        no_name = not name or name.isspace()
        no_name_fi = not name_fi or name_fi.isspace()
        if no_name and no_name_fi:
            raise serializers.ValidationError("Name (or nameFi) is required.")

        return data


class EquipmentCategoryUpdateSerializer(
    PrimaryKeyUpdateSerializer, EquipmentCategoryCreateSerializer
):
    class Meta(EquipmentCategoryCreateSerializer.Meta):
        fields = EquipmentCategoryCreateSerializer.Meta.fields + ["pk"]


class PurposeCreateSerializer(PurposeSerializer, PrimaryKeySerializer):
    pass


class PurposeUpdateSerializer(PurposeSerializer, PrimaryKeyUpdateSerializer):
    class Meta(PurposeSerializer.Meta):
        fields = PurposeSerializer.Meta.fields + ["pk"]


class ReservationUnitCreateSerializer(ReservationUnitSerializer, PrimaryKeySerializer):
    terms_of_use = serializers.CharField(required=False)
    name = serializers.CharField()
    max_reservation_duration = serializers.DurationField()
    min_reservation_duration = serializers.DurationField()

    class Meta(ReservationUnitSerializer.Meta):
        fields = ReservationUnitSerializer.Meta.fields + [
            "max_reservation_duration",
            "min_reservation_duration",
        ]


class ReservationUnitUpdateSerializer(
    ReservationUnitSerializer, PrimaryKeyUpdateSerializer
):
    name = serializers.CharField(required=False)

    class Meta(ReservationUnitCreateSerializer.Meta):
        fields = ReservationUnitCreateSerializer.Meta.fields + ["pk"]
