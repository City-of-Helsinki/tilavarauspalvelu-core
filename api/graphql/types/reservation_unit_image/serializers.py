from django.core import validators
from graphql import GraphQLError
from rest_framework import serializers

from api.graphql.extensions.legacy_helpers import (
    OldChoiceCharField,
    OldPrimaryKeySerializer,
    OldPrimaryKeyUpdateSerializer,
)
from common.fields.serializer import IntegerPrimaryKeyField
from reservation_units.models import ReservationUnit, ReservationUnitImage


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
