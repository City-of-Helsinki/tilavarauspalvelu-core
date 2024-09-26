from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from tilavarauspalvelu.models import ReservationUnitOption

from .filtersets import ReservationUnitOptionFilterSet


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
