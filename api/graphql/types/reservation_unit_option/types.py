from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields import RelatedField
from graphene_django_extensions.permissions import AllowAuthenticated

from api.graphql.types.allocated_time_slot.types import AllocatedTimeSlotNode
from api.graphql.types.reservation_unit_option.filtersets import ReservationUnitOptionFilterSet
from applications.models import ReservationUnitOption


class ReservationUnitOptionNode(DjangoNode):
    reservation_unit = RelatedField("api.graphql.types.reservation_units.types.ReservationUnitByPkType")

    allocated_time_slots = AllocatedTimeSlotNode.ListField()

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
