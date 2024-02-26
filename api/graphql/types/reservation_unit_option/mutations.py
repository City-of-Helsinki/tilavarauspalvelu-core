from graphene_django_extensions import UpdateMutation

from api.graphql.types.reservation_unit_option.permissions import ReservationUnitOptionPermission
from api.graphql.types.reservation_unit_option.serializers import ReservationUnitOptionHandlerSerializer

__all__ = [
    "ReservationUnitOptionUpdateMutation",
]


class ReservationUnitOptionUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitOptionHandlerSerializer
        permission_classes = [ReservationUnitOptionPermission]
