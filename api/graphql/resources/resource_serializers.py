from graphene.utils.str_converters import to_camel_case
from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.graphql.duration_field import DurationField
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.translate_fields import get_all_translatable_fields
from api.resources_api import ResourceSerializer
from resources.models import Resource
from spaces.models import Space


class ResourceCreateSerializer(ResourceSerializer, PrimaryKeySerializer):
    space_pk = IntegerPrimaryKeyField(
        queryset=Space.objects.all(),
        source="space",
        help_text="PK of the related space for this resource.",
    )
    location_type = serializers.CharField(
        required=False
    )  # For some reason graphene blows up if this isn't defined here.
    buffer_time_before = DurationField(
        required=False,
        help_text=(
            "Buffer time while reservation unit is unreservable before the reservation. "
            "Dynamically calculated from spaces and resources."
        ),
    )
    buffer_time_after = DurationField(
        required=False,
        help_text=(
            "Buffer time while reservation unit is unreservable after the reservation. "
            "Dynamically calculated from spaces and resources."
        ),
    )

    class Meta(ResourceSerializer.Meta):

        fields = [
            "pk",
            "location_type",
            "space_pk",
            "buffer_time_before",
            "buffer_time_after",
        ] + get_all_translatable_fields(Resource)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["space_pk"].required = False
        self.fields["space_pk"].allow_null = True

        self.translation_fields = get_all_translatable_fields(Resource)

    def validate(self, data):
        location_type = data.get("location_type")
        if not location_type or location_type not in (
            Resource.LOCATION_FIXED,
            Resource.LOCATION_MOVABLE,
        ):
            raise serializers.ValidationError(
                f"Wrong type of location type. Values are {Resource.LOCATION_FIXED, Resource.LOCATION_MOVABLE}"
            )

        errors = self.validate_for_publish(data)
        if errors:
            raise errors.popitem()[1]

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published resources."""
        validation_errors = {}

        if data.get("location_type") == Resource.LOCATION_FIXED and not data.get(
            "space"
        ):
            validation_errors["space"] = serializers.ValidationError(
                "Location type 'fixed' needs a space to be defined."
            )

        return validation_errors


class ResourceUpdateSerializer(PrimaryKeyUpdateSerializer, ResourceCreateSerializer):
    class Meta(ResourceCreateSerializer.Meta):
        fields = ResourceCreateSerializer.Meta.fields + ["pk"]

    def validate(self, data):
        if "location_type" in data:
            location_type = data.get("location_type")
            if location_type not in (
                Resource.LOCATION_FIXED,
                Resource.LOCATION_MOVABLE,
            ):
                raise serializers.ValidationError(
                    f"Wrong type of location type. Values are {Resource.LOCATION_FIXED, Resource.LOCATION_MOVABLE}"
                )

        for field, value in data.items():
            if field == "name_fi" and (not value or value == "" or value.isspace()):
                raise serializers.ValidationError(
                    f"Missing translation for {to_camel_case(field)}."
                )

            if field == "space":
                location_type = data.get("location_type")
                if not location_type:
                    location_type = self.instance.location_type
                if not data.get("space") and location_type == Resource.LOCATION_FIXED:
                    raise serializers.ValidationError(
                        "Location type 'fixed' needs a space to be defined."
                    )

        return data
