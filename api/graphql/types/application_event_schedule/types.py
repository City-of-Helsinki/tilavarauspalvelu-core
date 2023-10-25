import graphene
from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.reservation_units.types import ReservationUnitType
from applications.models import ApplicationEventSchedule
from permissions.helpers import user_has_staff_permissions


class ApplicationEventScheduleNode(DjangoAuthNode):
    allocated_reservation_unit = graphene.Field(ReservationUnitType)

    class Meta:
        model = ApplicationEventSchedule
        fields = [
            "pk",
            "day",
            "begin",
            "end",
            "priority",
            "declined",
            "allocated_day",
            "allocated_begin",
            "allocated_end",
            "allocated_reservation_unit",
        ]
        private_fields = {
            "declined": user_has_staff_permissions,
            "allocated_day": user_has_staff_permissions,
            "allocated_begin": user_has_staff_permissions,
            "allocated_end": user_has_staff_permissions,
            "allocated_reservation_unit": user_has_staff_permissions,
        }
        permission_classes = (AllowAuthenticated,)