from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.resources_api import ResourceSerializer
from resources.models import Resource


class ResourceCreateSerializer(ResourceSerializer, PrimaryKeySerializer):
    location_type = serializers.CharField(
        required=False
    )  # For some reason graphene blows up if this isn't defined here.

    class Meta(ResourceSerializer.Meta):
        fields = ResourceSerializer.Meta.fields + [
            "name_fi",
            "name_en",
            "name_sv",
            "is_draft",
            "description_fi",
            "description_en",
            "description_sv",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["space_id"].required = False
        self.fields["space_id"].allow_null = True
        self.fields["name"].required = False

        self.translation_fields = [
            "name_fi",
            "name_en",
            "name_sv",
            "description_fi",
            "description_en",
            "description_sv",
        ]

    def validate(self, data):
        location_type = data.get("location_type")
        if not location_type or location_type not in (
            Resource.LOCATION_FIXED,
            Resource.LOCATION_MOVABLE,
        ):
            raise serializers.ValidationError(
                f"Wrong type of location type. Values are {Resource.LOCATION_FIXED, Resource.LOCATION_MOVABLE}"
            )

        is_draft = data.get("is_draft")

        if not is_draft:
            errors = self.validate_for_publish(data)
            if errors:
                raise errors.popitem()[1]

        return data

    def validate_for_publish(self, data):
        """Validates necessary fields for published resources."""
        validation_errors = {}

        for field in self.translation_fields:
            value = data.get(field)
            if not value or value.isspace():
                validation_errors[field] = serializers.ValidationError(
                    f"Not draft state resources must have a translations. Missing translation for {field}."
                )

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

        is_draft = data.get("is_draft", self.instance.is_draft)
        if not is_draft:
            for field, value in data.items():
                if field in self.translation_fields:
                    if not value or value == "" or value.isspace():
                        raise serializers.ValidationError(
                            f"Not draft state resources must have a translations. Missing translation for {field}."
                        )

                if field == "space":
                    location_type = data.get("location_type")
                    if not location_type:
                        location_type = self.instance.location_type
                    if (
                        not data.get("space")
                        and location_type == Resource.LOCATION_FIXED
                    ):
                        raise serializers.ValidationError(
                            "Location type 'fixed' needs a space to be defined."
                        )

        return data
