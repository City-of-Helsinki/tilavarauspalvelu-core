from rest_framework import serializers

from api.graphql.base_serializers import (
    PrimaryKeySerializer,
    PrimaryKeyUpdateSerializer,
)
from api.reservation_units_api import PurposeSerializer, ReservationUnitSerializer


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
