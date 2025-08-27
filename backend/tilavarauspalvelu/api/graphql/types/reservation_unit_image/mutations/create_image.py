from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import ReservationUnit, ReservationUnitImage, User

__all__ = [
    "ReservationUnitImageCreateMutation",
]


class ReservationUnitImageCreateMutation(MutationType[ReservationUnitImage], kind="create"):
    reservation_unit = Input(ReservationUnit, required=True)
    image = Input(required=True)
    image_type = Input()

    @classmethod
    def __permissions__(cls, instance: ReservationUnitImage, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        reservation_unit: ReservationUnit = input_data["reservation_unit"]
        user = info.context.user
        if not user.permissions.can_manage_unit(reservation_unit.unit):
            msg = "No permission to create a reservation unit image"
            raise GraphQLPermissionError(msg)
