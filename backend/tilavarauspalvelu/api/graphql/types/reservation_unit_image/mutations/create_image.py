from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import ReservationUnit, ReservationUnitImage, User
from tilavarauspalvelu.typing import error_codes

__all__ = [
    "ReservationUnitImageCreateMutation",
]


class ReservationUnitImageCreateMutation(MutationType[ReservationUnitImage], kind="create"):
    reservation_unit = Input()
    image = Input(required=True)
    image_type = Input()

    @classmethod
    def __permissions__(cls, instance: ReservationUnitImage, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        reservation_unit_pk: int = input_data["reservation_unit"]

        reservation_unit = ReservationUnit.objects.filter(pk=reservation_unit_pk).select_related("unit").first()
        if reservation_unit is None:
            msg = f"Reservation Unit with primary key {reservation_unit_pk!r} does not exist."
            raise GraphQLPermissionError(msg, code=error_codes.ENTITY_NOT_FOUND)

        user = info.context.user
        if not user.permissions.can_manage_unit(reservation_unit.unit):
            msg = "No permission to create a reservation unit image"
            raise GraphQLPermissionError(msg)
