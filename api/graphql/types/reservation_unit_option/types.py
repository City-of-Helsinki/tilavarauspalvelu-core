from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from api.graphql.types.reservation_unit_option.filtersets import ReservationUnitOptionFilterSet
from applications.models import ReservationUnitOption


class ReservationUnitOptionNode(DjangoNode):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
            "locked",
            "rejected",
            "reservation_unit",
            "application_section",
            "allocated_time_slots",
        ]
        filterset_class = ReservationUnitOptionFilterSet
        permission_classes = [AllowAuthenticated]
