from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.reservation_cancel_reason.filtersets import ReservationCancelReasonFilterSet
from reservations.models import ReservationCancelReason


class ReservationCancelReasonNode(DjangoAuthNode):
    class Meta:
        model = ReservationCancelReason
        fields = [
            "pk",
            "reason",
        ]
        filterset_class = ReservationCancelReasonFilterSet
        permission_classes = (AllowAuthenticated,)
