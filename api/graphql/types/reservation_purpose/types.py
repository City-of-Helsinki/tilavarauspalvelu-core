from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.reservation_purpose.filtersets import ReservationPurposeFilterSet
from api.graphql.types.reservation_purpose.permissions import ReservationPurposePermission
from reservations.models import ReservationPurpose


class ReservationPurposeNode(DjangoAuthNode):
    class Meta:
        model = ReservationPurpose
        fields = [
            "pk",
            "name",
        ]
        filterset_class = ReservationPurposeFilterSet
        permission_classes = (ReservationPurposePermission,)
