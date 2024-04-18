from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from api.graphql.types.reservation_unit_image.permissions import ReservationUnitImagePermission
from api.graphql.types.reservation_unit_image.serializers import (
    ReservationUnitImageCreateSerializer,
    ReservationUnitImageUpdateSerializer,
)
from reservation_units.models import ReservationUnitImage

__all__ = [
    "ReservationUnitImageCreateMutation",
    "ReservationUnitImageDeleteMutation",
    "ReservationUnitImageUpdateMutation",
]


class ReservationUnitImageCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationUnitImageCreateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitImageUpdateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageDeleteMutation(DeleteMutation):
    class Meta:
        model = ReservationUnitImage
        permission_classes = [ReservationUnitImagePermission]
