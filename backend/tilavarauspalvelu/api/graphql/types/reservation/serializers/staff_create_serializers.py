from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import (
    AccessType,
    CustomerTypeChoice,
    MunicipalityChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose, ReservationUnit
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import StaffCreateReservationData


class ReservationStaffCreateSerializer(NestingModelSerializer):
    """Create a reservation as a staff user."""

    instance: None

    pk = IntegerField(read_only=True)
    reservation_unit = IntegerPrimaryKeyField(queryset=ReservationUnit.objects, required=True, write_only=True)

    reservee_type = EnumFriendlyChoiceField(
        choices=CustomerTypeChoice.choices,
        enum=CustomerTypeChoice,
        required=False,
    )
    type = EnumFriendlyChoiceField(
        choices=ReservationTypeChoice.choices,
        enum=ReservationTypeChoice,
        required=True,
    )
    municipality = EnumFriendlyChoiceField(
        choices=MunicipalityChoice.choices,
        enum=MunicipalityChoice,
        allow_null=True,
        default=None,
        required=False,
    )

    purpose = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects, allow_null=True, required=False)
    age_group = IntegerPrimaryKeyField(queryset=AgeGroup.objects, allow_null=True, required=False)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            #
            # Basic information
            "name",
            "description",
            "num_persons",
            "working_memo",
            "type",
            "municipality",
            #
            # Time information
            "begins_at",
            "ends_at",
            "buffer_time_before",
            "buffer_time_after",
            #
            # Free of charge information
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            # Reservee information
            "reservee_id",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_is_unregistered_association",
            "reservee_type",
            #
            # Billing information
            "billing_first_name",
            "billing_last_name",
            "billing_phone",
            "billing_email",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            # Relations
            "reservation_unit",
            "age_group",
            "purpose",
            #
            # Read only
            "state",
            "confirmed_at",
            "handled_at",
        ]
        extra_kwargs = {
            "confirmed_at": {"read_only": True},
            "handled_at": {"read_only": True},
        }

    def validate(self, data: StaffCreateReservationData) -> StaffCreateReservationData:
        begins_at = data.get("begins_at").astimezone(DEFAULT_TIMEZONE)
        ends_at = data.get("ends_at").astimezone(DEFAULT_TIMEZONE)

        # Endpoint requires user to be logged in
        user: User = self.context["request"].user
        reservation_unit: ReservationUnit = data["reservation_unit"]

        if reservation_unit.reservation_block_whole_day:
            data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begins_at)
            data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservation_type = data.get("type")
        reservation_unit.validators.validate_can_create_reservation_type(reservation_type=reservation_type)

        # For blocking reservations, buffer times can overlap existing reservations.
        if reservation_type == ReservationTypeChoice.BLOCKED:
            buffer_time_before = datetime.timedelta()
            buffer_time_after = datetime.timedelta()
        else:
            buffer_time_before = data.get("buffer_time_before")
            buffer_time_after = data.get("buffer_time_after")

        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=buffer_time_before,
            new_buffer_time_after=buffer_time_after,
        )

        now = local_datetime()
        id_token = user.id_token

        data["handled_at"] = now
        data["confirmed_at"] = now
        data["state"] = ReservationStateChoice.CONFIRMED
        data["user"] = user
        data["reservee_used_ad_login"] = False if id_token is None else id_token.is_ad_login
        data["access_type"] = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        return data

    def create(self, validated_data: StaffCreateReservationData) -> Reservation:
        reservation: Reservation = super().create(validated_data)

        # After creating the reservation, check again if there are any overlapping reservations.
        # This can fail if two reservations are created for reservation units in the same
        # space-resource hierarchy at almost the same time, meaning when we check for overlapping
        # reservations during validation, neither of the reservations are yet created.
        if reservation.actions.overlapping_reservations().exists():
            reservation.delete()
            msg = "Overlapping reservations were created at the same time."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        if reservation.access_type == AccessType.ACCESS_CODE:
            is_active = reservation.type != ReservationTypeChoice.BLOCKED
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.create_access_code(obj=reservation, is_active=is_active)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {reservation.pk}")

        return reservation
