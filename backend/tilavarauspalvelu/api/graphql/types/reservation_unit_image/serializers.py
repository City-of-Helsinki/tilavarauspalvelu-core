from __future__ import annotations

from django.core import validators
from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers

from tilavarauspalvelu.models import ReservationUnitImage


class ReservationUnitImageCreateSerializer(NestingModelSerializer):
    image = serializers.ImageField(
        write_only=True,
        validators=[validators.validate_image_file_extension],
    )

    class Meta:
        model = ReservationUnitImage
        fields = [
            "pk",
            "reservation_unit",
            "image",
            "image_type",
        ]


class ReservationUnitImageUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitImage
        fields = [
            "pk",
            "image_type",
        ]


class ReservationUnitImageFieldSerializer(NestingModelSerializer):
    image_url = serializers.ImageField(source="image", use_url=True)
    medium_url = serializers.SerializerMethodField()
    small_url = serializers.SerializerMethodField()
    large_url = serializers.SerializerMethodField()

    class Meta:
        model = ReservationUnitImage
        fields = [
            "image_url",
            "large_url",
            "medium_url",
            "small_url",
            "image_type",
        ]

    def get_small_url(self, obj: ReservationUnitImage) -> str | None:
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.small_url)

    def get_medium_url(self, obj: ReservationUnitImage) -> str | None:
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.medium_url)

    def get_large_url(self, obj: ReservationUnitImage) -> str | None:
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.large_url)
