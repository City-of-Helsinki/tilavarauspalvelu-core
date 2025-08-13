from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import ReservationUnitOption, User

__all__ = [
    "ReservationUnitOptionUpdateMutation",
]


class ReservationUnitOptionUpdateMutation(MutationType[ReservationUnitOption], kind="update"):
    pk = Input()
    is_rejected = Input()
    is_locked = Input()

    @is_rejected.validate
    def validate_is_rejected(root: ReservationUnitOption, info: GQLInfo[User], value: bool) -> None:  # noqa: FBT001
        if value is True and root.allocated_time_slots.exists():
            msg = "Cannot reject a reservation unit option with allocations"
            raise GraphQLValidationError(msg)

    @classmethod
    def __permissions__(cls, instance: ReservationUnitOption, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        unit = instance.reservation_unit.unit
        if not user.permissions.can_manage_applications_for_units([unit]):
            msg = "No permission to update an application option"
            raise GraphQLPermissionError(msg)
