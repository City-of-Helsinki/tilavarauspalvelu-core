from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.reservation_deny_reason.filtersets import ReservationDenyReasonFilterSet
from reservations.models import ReservationDenyReason


class ReservationDenyReasonNode(DjangoAuthNode):
    class Meta:
        model = ReservationDenyReason
        fields = [
            "pk",
            "reason",
        ]
        filterset_class = ReservationDenyReasonFilterSet
        permission_classes = (AllowAuthenticated,)
