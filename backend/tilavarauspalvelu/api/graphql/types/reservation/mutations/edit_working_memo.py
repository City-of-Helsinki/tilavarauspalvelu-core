from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import ReservationWorkingMemoData


class ReservationWorkingMemoMutation(MutationType[Reservation], kind="update"):
    """Update the working memo of a reservation."""

    pk = Input(required=True)
    working_memo = Input(required=True)

    @classmethod
    def __permissions__(
        cls,
        instance: Reservation,
        info: GQLInfo[User],
        input_data: ReservationWorkingMemoData,
    ) -> None:
        user = info.context.user
        if not user.permissions.can_view_reservation(instance, reserver_needs_role=True):
            msg = "No permission to edit this reservation's working memo."
            raise GraphQLPermissionError(msg)
