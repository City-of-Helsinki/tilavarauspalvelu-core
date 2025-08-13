from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import ReservationUnitImage, User

__all__ = [
    "ReservationUnitImageUpdateMutation",
]


class ReservationUnitImageUpdateMutation(MutationType[ReservationUnitImage], kind="update"):
    pk = Input()
    image_type = Input(required=True)

    @classmethod
    def __permissions__(cls, instance: ReservationUnitImage, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        unit = instance.reservation_unit.unit
        user = info.context.user
        if not user.permissions.can_manage_unit(unit):
            msg = "No permission to update a reservation unit image"
            raise GraphQLPermissionError(msg)
