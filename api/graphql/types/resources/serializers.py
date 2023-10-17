from graphene.utils.str_converters import to_camel_case
from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.extensions.duration_field import DurationField
from api.graphql.extensions.legacy_helpers import (
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
    get_all_translatable_fields,
)
from api.legacy_rest_api.base_serializers import OldTranslatedModelSerializer
from common.fields.serializer import IntegerPrimaryKeyField
from resources.models import Resource
from spaces.models import Space


class ResourceSerializer(OldTranslatedModelSerializer):
    space_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="space",
        help_text="Id of related space for this resource.",
    )

    class Meta:
        model = Resource
        fields = [
            "id",
            "location_type",
            "name",
            "space_id",
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "State of the reservation. Default is 'created'.",
            },
            "location_type": {
                "help_text": "Priority of this reservation. Higher priority reservations replaces lower ones.",
            },
            "buffer_time_before": {
                "help_text": "Buffer time while reservation unit is unreservable after the reservation. "
                "Dynamically calculated from spaces and resources.",
            },
            "buffer_time_after": {
                "help_text": "Begin date and time of the reservation.",
            },
        }


class ResourceCreateSerializer(ResourceSerializer, OldPrimaryKeySerializer):
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
            raise GraphQLError(
                f"Wrong type of location type. Values are {Resource.LOCATION_FIXED, Resource.LOCATION_MOVABLE}"
            )

        errors = self.validate_for_publish(data)
        if errors:
            raise errors.popitem()[1]

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published resources."""
        validation_errors = {}

        if data.get("location_type") == Resource.LOCATION_FIXED and not data.get("space"):
            validation_errors["space"] = GraphQLError("Location type 'fixed' needs a space to be defined.")

        return validation_errors


class ResourceUpdateSerializer(OldPrimaryKeyUpdateSerializer, ResourceCreateSerializer):
    class Meta(ResourceCreateSerializer.Meta):
        fields = ResourceCreateSerializer.Meta.fields + ["pk"]

    def validate(self, data):
        if "location_type" in data:
            location_type = data.get("location_type")
            if location_type not in (
                Resource.LOCATION_FIXED,
                Resource.LOCATION_MOVABLE,
            ):
                raise GraphQLError(
                    f"Wrong type of location type. Values are {Resource.LOCATION_FIXED, Resource.LOCATION_MOVABLE}"
                )

        for field, value in data.items():
            if field == "name_fi" and (not value or value == "" or value.isspace()):
                raise GraphQLError(f"Missing translation for {to_camel_case(field)}.")

            if field == "space":
                location_type = data.get("location_type")
                if not location_type:
                    location_type = self.instance.location_type
                if not data.get("space") and location_type == Resource.LOCATION_FIXED:
                    raise GraphQLError("Location type 'fixed' needs a space to be defined.")

        return data
