from graphene_django_extensions import CreateMutation, UpdateMutation

from tilavarauspalvelu.api.graphql.types.reservation_unit.permissions import ReservationUnitPermission
from tilavarauspalvelu.api.graphql.types.reservation_unit.serializers import ReservationUnitSerializer


class ReservationUnitCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]


class ReservationUnitUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]
