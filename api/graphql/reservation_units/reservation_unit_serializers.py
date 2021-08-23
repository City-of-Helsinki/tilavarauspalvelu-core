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


class ReservationUnitUpdateSerializer(
    ReservationUnitSerializer, PrimaryKeyUpdateSerializer
):
    class Meta(ReservationUnitSerializer.Meta):
        fields = ReservationUnitSerializer.Meta.fields + ["pk"]
