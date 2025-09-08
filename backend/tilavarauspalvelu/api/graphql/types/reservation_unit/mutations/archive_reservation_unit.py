from typing import Any

from auditlog.models import LogEntry
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.models import ReservationUnit, User
from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

__all__ = [
    "ReservationUnitArchiveMutation",
]


class ReservationUnitArchiveMutation(MutationType[ReservationUnit], kind="update"):
    """Archive a reservation unit."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: ReservationUnit, info: GQLInfo[User], input_data: dict[str, Any]) -> ReservationUnit:
        user = info.context.user
        if not user.permissions.can_manage_unit(instance.unit):
            msg = "No permission to archive this reservation unit"
            raise GraphQLPermissionError(msg)

        if instance.is_archived:
            return instance

        future_reservations = instance.reservations.all().going_to_occur().filter(ends_at__gt=local_datetime())
        if future_reservations.exists():
            msg = "Reservation unit can't be archived if it has any reservations in the future"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_HAS_FUTURE_RESERVATIONS)

        instance.is_archived = True

        # Remove PII
        instance.contact_information = ""
        instance.is_draft = True

        instance.save(update_fields=["is_archived", "contact_information", "is_draft"])

        # Remove all logs related to the reservation unit
        LogEntry.objects.get_for_object(instance).delete()

        return instance

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationUnitQuerySet, info: GQLInfo[User]) -> ReservationUnitQuerySet:
        # Allow returning archived reservation units from this mutation
        return queryset
