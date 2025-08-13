from typing import Any

from django.conf import settings
from django.db import transaction
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError
from undine.utils.model_utils import get_instance_or_raise

from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose, ReservationSeries, User
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from tilavarauspalvelu.typing import ReservationSeriesUpdateData

__all__ = [
    "ReservationSeriesUpdateMutation",
]


class ReservationSeriesReservationUpdateInput(MutationType[Reservation], kind="related"):
    # Basic information
    name = Input(required=False)
    description = Input(required=False)
    num_persons = Input(required=False)
    municipality = Input(required=False)
    working_memo = Input(required=False)

    # Free of charge information
    applying_for_free_of_charge = Input(required=False)
    free_of_charge_reason = Input(required=False)

    # Reservee information
    reservee_identifier = Input(required=False)
    reservee_first_name = Input(required=False)
    reservee_last_name = Input(required=False)
    reservee_email = Input(required=False)
    reservee_phone = Input(required=False)
    reservee_organisation_name = Input(required=False)
    reservee_address_street = Input(required=False)
    reservee_address_city = Input(required=False)
    reservee_address_zip = Input(required=False)
    reservee_type = Input(required=False)

    # Relations
    purpose = Input(ReservationPurpose, required=False)
    age_group = Input(AgeGroup, required=False)


class ReservationSeriesUpdateMutation(MutationType[ReservationSeries]):
    """Update reservation series and its reservation data."""

    pk = Input(required=True)

    name = Input(required=False)
    description = Input(required=False)

    age_group = Input(AgeGroup, required=False)

    reservation_details = Input(ReservationSeriesReservationUpdateInput, many=False, required=True, default_value={})
    skip_reservations = Input(list[int], default_value=[], input_only=False)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: ReservationSeriesUpdateData) -> ReservationSeries:
        instance = get_instance_or_raise(model=ReservationSeries, pk=input_data["pk"])
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        reservation_details = input_data.get("reservation_details", {})
        skip_reservations = input_data.get("skip_reservations", [])

        age_group = input_data.get("age_group")
        if age_group is not None:
            reservation_details.setdefault("age_group", age_group)

        description = input_data.get("description")
        if description is not None:
            reservation_details.setdefault("working_memo", description)

        reservations = instance.reservations.exclude(pk__in=skip_reservations)
        reservation_pks = list(reservations.values_list("pk", flat=True))

        with transaction.atomic():
            instance.name = input_data.get("name", instance.name)
            instance.description = input_data.get("description", instance.description)
            instance.age_group = input_data.get("age_group", instance.age_group)
            instance.save()

            reservations.update(**reservation_details)

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(reservation_pks=reservation_pks)

        return instance
