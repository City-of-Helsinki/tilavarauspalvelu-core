from __future__ import annotations

import datetime
from contextlib import suppress
from typing import TYPE_CHECKING, overload

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.models import ApplicationSection, RecurringReservation, Reservation
from tilavarauspalvelu.typing import (
    PindoraReservationInfoData,
    PindoraSectionInfoData,
    PindoraSeriesInfoData,
    PindoraValidityInfoData,
)
from utils.date_utils import DEFAULT_TIMEZONE

from .client import PindoraClient
from .exceptions import PindoraClientError, PindoraConflictError, PindoraInvalidValueError, PindoraNotFoundError
from .typing import PindoraAccessCodeModifyResponse, PindoraAccessCodePeriod

if TYPE_CHECKING:
    import uuid

    from .typing import (
        PindoraAccessCodeValidity,
        PindoraReservationSeriesAccessCodeValidity,
        PindoraSeasonalBookingAccessCodeValidity,
    )


__all__ = [
    "PindoraService",
]


class PindoraService:
    """Service for Pindora operations."""

    @classmethod
    @overload
    def get_access_code(cls, obj: Reservation) -> PindoraReservationInfoData: ...

    @classmethod
    @overload
    def get_access_code(cls, obj: RecurringReservation) -> PindoraSeriesInfoData: ...

    @classmethod
    @overload
    def get_access_code(cls, obj: ApplicationSection) -> PindoraSectionInfoData: ...

    @classmethod
    def get_access_code(cls, obj):
        """Get access code from Pindora through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                response = PindoraClient.get_seasonal_booking(obj)

                series_for_section = RecurringReservation.objects.filter(
                    allocated_time_slot__reservation_unit_option__application_section=obj
                )

                access_code_validity: list[PindoraValidityInfoData] = []
                for series in series_for_section:
                    validity = cls._parse_series_validity_info(series, response["reservation_unit_code_validity"])
                    access_code_validity.extend(validity)

                return PindoraSectionInfoData(
                    access_code=response["access_code"],
                    access_code_generated_at=response["access_code_generated_at"],
                    access_code_is_active=response["access_code_is_active"],
                    access_code_keypad_url=response["access_code_keypad_url"],
                    access_code_phone_number=response["access_code_phone_number"],
                    access_code_sms_number=response["access_code_sms_number"],
                    access_code_sms_message=response["access_code_sms_message"],
                    access_code_validity=access_code_validity,
                )

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    response = PindoraClient.get_reservation_series(obj)
                    validity = cls._parse_series_validity_info(obj, response["reservation_unit_code_validity"])
                    return PindoraSeriesInfoData(
                        access_code=response["access_code"],
                        access_code_generated_at=response["access_code_generated_at"],
                        access_code_is_active=response["access_code_is_active"],
                        access_code_keypad_url=response["access_code_keypad_url"],
                        access_code_phone_number=response["access_code_phone_number"],
                        access_code_sms_number=response["access_code_sms_number"],
                        access_code_sms_message=response["access_code_sms_message"],
                        access_code_validity=validity,
                    )

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                section_data: PindoraSectionInfoData = cls.get_access_code(section)

                validity = [acv for acv in section_data.access_code_validity if acv.reservation_series_id == obj.id]

                return PindoraSeriesInfoData(
                    access_code=section_data.access_code,
                    access_code_generated_at=section_data.access_code_generated_at,
                    access_code_is_active=section_data.access_code_is_active,
                    access_code_keypad_url=section_data.access_code_keypad_url,
                    access_code_phone_number=section_data.access_code_phone_number,
                    access_code_sms_number=section_data.access_code_sms_number,
                    access_code_sms_message=section_data.access_code_sms_message,
                    access_code_validity=validity,
                )

            case Reservation():
                if obj.recurring_reservation is None:
                    response = PindoraClient.get_reservation(obj)
                    period = cls._parse_code_valid_period(response)
                    return PindoraReservationInfoData(
                        access_code=response["access_code"],
                        access_code_generated_at=response["access_code_generated_at"],
                        access_code_is_active=response["access_code_is_active"],
                        access_code_keypad_url=response["access_code_keypad_url"],
                        access_code_phone_number=response["access_code_phone_number"],
                        access_code_sms_number=response["access_code_sms_number"],
                        access_code_sms_message=response["access_code_sms_message"],
                        access_code_begins_at=period["access_code_begins_at"],
                        access_code_ends_at=period["access_code_ends_at"],
                    )

                series = obj.recurring_reservation
                series_data: PindoraSeriesInfoData = cls.get_access_code(series)

                next_valid = (acv for acv in series_data.access_code_validity if acv.reservation_id == obj.id)
                validity = next(next_valid, None)

                if validity is None:
                    raise PindoraInvalidValueError(entity="reservation", error="Access code not found")

                return PindoraReservationInfoData(
                    access_code=series_data.access_code,
                    access_code_generated_at=series_data.access_code_generated_at,
                    access_code_is_active=series_data.access_code_is_active,
                    access_code_keypad_url=series_data.access_code_keypad_url,
                    access_code_phone_number=series_data.access_code_phone_number,
                    access_code_sms_number=series_data.access_code_sms_number,
                    access_code_sms_message=series_data.access_code_sms_message,
                    access_code_begins_at=validity.access_code_begins_at,
                    access_code_ends_at=validity.access_code_ends_at,
                )

            case _:
                msg = f"Invalid target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def create_access_code(
        cls, obj: ApplicationSection | RecurringReservation | Reservation, *, is_active: bool = False
    ) -> PindoraAccessCodeModifyResponse:
        """Create access code in Pindora through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                response = PindoraClient.create_seasonal_booking(obj, is_active=is_active)
                obj.actions.get_reservations().requires_active_access_code().update(
                    access_code_generated_at=response["access_code_generated_at"],
                    access_code_is_active=response["access_code_is_active"],
                )

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    response = PindoraClient.create_reservation_series(obj, is_active=is_active)
                    obj.reservations.requires_active_access_code().update(
                        access_code_generated_at=response["access_code_generated_at"],
                        access_code_is_active=response["access_code_is_active"],
                    )
                else:
                    section = obj.allocated_time_slot.reservation_unit_option.application_section
                    response = cls.create_access_code(section, is_active=is_active)

            case Reservation():
                if obj.recurring_reservation is None:
                    response = PindoraClient.create_reservation(obj, is_active=is_active)
                    obj.access_code_generated_at = response["access_code_generated_at"]
                    obj.access_code_is_active = response["access_code_is_active"]
                    obj.save(update_fields=["access_code_generated_at", "access_code_is_active"])
                else:
                    series = obj.recurring_reservation
                    response = cls.create_access_code(series, is_active=is_active)

            case _:
                msg = f"Invalid create target: {obj}"
                raise PindoraClientError(msg)

        return PindoraAccessCodeModifyResponse(
            access_code_generated_at=response["access_code_generated_at"],
            access_code_is_active=response["access_code_is_active"],
        )

    @classmethod
    def reschedule_access_code(
        cls, obj: ApplicationSection | RecurringReservation | Reservation
    ) -> PindoraAccessCodeModifyResponse:
        """Reschedule Pindora access code through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                response = PindoraClient.reschedule_seasonal_booking(obj)
                obj.actions.get_reservations().requires_active_access_code().update(
                    access_code_generated_at=response["access_code_generated_at"],
                    access_code_is_active=response["access_code_is_active"],
                )
                return response

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    response = PindoraClient.reschedule_reservation_series(obj)
                    obj.reservations.requires_active_access_code().update(
                        access_code_generated_at=response["access_code_generated_at"],
                        access_code_is_active=response["access_code_is_active"],
                    )
                    return response

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                return cls.reschedule_access_code(section)

            case Reservation():
                if obj.recurring_reservation is None:
                    response = PindoraClient.reschedule_reservation(obj)
                    obj.access_code_generated_at = response["access_code_generated_at"]
                    obj.access_code_is_active = response["access_code_is_active"]
                    obj.save(update_fields=["access_code_generated_at", "access_code_is_active"])
                    return response

                series = obj.recurring_reservation
                return cls.reschedule_access_code(series)

            case _:
                msg = f"Invalid reschedule target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def change_access_code(
        cls, obj: ApplicationSection | RecurringReservation | Reservation
    ) -> PindoraAccessCodeModifyResponse:
        """Change Pindora access code through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                response = PindoraClient.change_seasonal_booking_access_code(obj)
                obj.actions.get_reservations().requires_active_access_code().update(
                    access_code_generated_at=response["access_code_generated_at"],
                    access_code_is_active=response["access_code_is_active"],
                )
                return response

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    response = PindoraClient.change_reservation_series_access_code(obj)
                    obj.reservations.requires_active_access_code().update(
                        access_code_generated_at=response["access_code_generated_at"],
                        access_code_is_active=response["access_code_is_active"],
                    )
                    return response

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                return cls.change_access_code(section)

            case Reservation():
                if obj.recurring_reservation is None:
                    response = PindoraClient.change_reservation_access_code(obj)
                    obj.access_code_generated_at = response["access_code_generated_at"]
                    obj.access_code_is_active = response["access_code_is_active"]
                    obj.save(update_fields=["access_code_generated_at", "access_code_is_active"])
                    return response

                series = obj.recurring_reservation
                return cls.change_access_code(series)

            case _:
                msg = f"Invalid change access code target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def activate_access_code(cls, obj: ApplicationSection | RecurringReservation | Reservation) -> None:
        """Activate Pindora access code through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                PindoraClient.activate_seasonal_booking_access_code(obj)
                obj.actions.get_reservations().requires_active_access_code().update(access_code_is_active=True)

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    PindoraClient.activate_reservation_series_access_code(obj)
                    obj.reservations.requires_active_access_code().update(access_code_is_active=True)
                    return

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                cls.activate_access_code(section)

            case Reservation():
                if obj.recurring_reservation is None:
                    PindoraClient.activate_reservation_access_code(obj)
                    obj.access_code_is_active = True
                    obj.save(update_fields=["access_code_is_active"])
                    return

                series = obj.recurring_reservation
                cls.activate_access_code(series)

            case _:
                msg = f"Invalid activate target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def deactivate_access_code(cls, obj: ApplicationSection | RecurringReservation | Reservation) -> None:
        """Deactivate Pindora access code through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                PindoraClient.deactivate_seasonal_booking_access_code(obj)
                obj.actions.get_reservations().requires_active_access_code().update(access_code_is_active=False)

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    PindoraClient.deactivate_reservation_series_access_code(obj)
                    obj.reservations.requires_active_access_code().update(access_code_is_active=False)
                    return

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                cls.deactivate_access_code(section)

            case Reservation():
                if obj.recurring_reservation is None:
                    PindoraClient.deactivate_reservation_access_code(obj)
                    obj.access_code_is_active = False
                    obj.save(update_fields=["access_code_is_active"])
                    return

                series = obj.recurring_reservation
                cls.deactivate_access_code(series)

            case _:
                msg = f"Invalid deactivate target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def delete_access_code(cls, obj: ApplicationSection | RecurringReservation | Reservation) -> None:
        """Delete Pindora access code through the correct Pindora API endpoint according to the object's type."""
        match obj:
            case ApplicationSection():
                PindoraClient.delete_seasonal_booking(obj)

                Reservation.objects.filter(
                    recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=obj,
                ).update(access_code_generated_at=None, access_code_is_active=False)

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    PindoraClient.delete_reservation_series(obj)

                    Reservation.objects.filter(
                        recurring_reservation=obj,
                    ).update(access_code_generated_at=None, access_code_is_active=False)

                    return

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                cls.delete_access_code(section)

            case Reservation():
                if obj.recurring_reservation is None:
                    PindoraClient.delete_reservation(obj)
                    obj.access_code_generated_at = None
                    obj.access_code_is_active = False
                    obj.save(update_fields=["access_code_generated_at", "access_code_is_active"])
                    return

                series = obj.recurring_reservation
                cls.delete_access_code(series)

            case _:
                msg = f"Invalid delete target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def sync_access_code(cls, obj: ApplicationSection | RecurringReservation | Reservation) -> None:
        """
        Synchronizes the access code through the correct Pindora API endpoints according to the object's type
        so that it matches what Varaamo thinks is the correct state.
        """
        match obj:
            case ApplicationSection():
                cls._sync_series_or_seasonal_booking_access_code(obj)

            case RecurringReservation():
                if obj.allocated_time_slot is None:
                    cls._sync_series_or_seasonal_booking_access_code(obj)
                    return

                section = obj.allocated_time_slot.reservation_unit_option.application_section
                cls.sync_access_code(obj=section)

            case Reservation():
                if obj.recurring_reservation is None:
                    cls._sync_reservation_access_code(obj)
                    return

                series = obj.recurring_reservation
                cls.sync_access_code(obj=series)

            case _:
                msg = f"Invalid sync target: {obj}"
                raise PindoraClientError(msg)

    @classmethod
    def _sync_reservation_access_code(cls, reservation: Reservation) -> None:
        # Access type is not 'ACCESS_CODE', delete the access code (if it exists)
        if reservation.access_type != AccessType.ACCESS_CODE:
            with suppress(PindoraNotFoundError):
                cls.delete_access_code(obj=reservation)
            return

        should_be_active = reservation.access_code_should_be_active

        # Otherwise, reschedule or create the access code in Pindora.
        # Do one of the operations first depending on if we think the access code has been generated or not.
        # This doubles as a way to ensure that the access code is correctly active or inactive in Pindora.
        if reservation.access_code_generated_at is None:
            try:
                response = PindoraClient.create_reservation(reservation=reservation, is_active=should_be_active)
            except PindoraConflictError:
                response = PindoraClient.reschedule_reservation(reservation=reservation, is_active=should_be_active)
        else:
            try:
                response = PindoraClient.reschedule_reservation(reservation=reservation, is_active=should_be_active)
            except PindoraNotFoundError:
                response = PindoraClient.create_reservation(reservation=reservation, is_active=should_be_active)

        reservation.access_code_generated_at = response["access_code_generated_at"]
        reservation.access_code_is_active = response["access_code_is_active"]
        reservation.save(update_fields=["access_code_generated_at", "access_code_is_active"])

    @classmethod
    def _sync_series_or_seasonal_booking_access_code(cls, obj: RecurringReservation | ApplicationSection) -> None:
        should_be_active: bool = obj.should_have_active_access_code  # type: ignore[attr-defined]

        try:
            if should_be_active:
                cls.activate_access_code(obj=obj)
            else:
                cls.deactivate_access_code(obj=obj)
        except PindoraNotFoundError:
            # Reservation series and application sections always have an access code, even if it's not active.
            cls.create_access_code(obj=obj, is_active=should_be_active)

        cls.reschedule_access_code(obj=obj)

    @classmethod
    def _parse_series_validity_info(
        cls,
        series: RecurringReservation,
        validities: list[PindoraReservationSeriesAccessCodeValidity | PindoraSeasonalBookingAccessCodeValidity],
    ) -> list[PindoraValidityInfoData]:
        """
        Given the list of access code validity info from Pindora (either for a reservation series
        or an application section), construct a list of info objects for this reservation series with
        the pre-calculated access code validity times as well as the reservation and series ids.
        """
        reservations_by_period: dict[tuple[datetime.datetime, datetime.datetime, uuid.UUID], int] = {}

        for reservation in series.reservations.requires_active_access_code():
            begin = reservation.begin.astimezone(DEFAULT_TIMEZONE)
            end = reservation.end.astimezone(DEFAULT_TIMEZONE)
            reservations_by_period[begin, end, series.reservation_unit.uuid] = reservation.pk

        access_code_validity: list[PindoraValidityInfoData] = []
        for validity in validities:
            reservation_unit_uuid = validity.get("reservation_unit_id", series.reservation_unit.uuid)
            key = (validity["begin"], validity["end"], reservation_unit_uuid)
            reservation_id = reservations_by_period.get(key)

            # This will filter out other series' reservations in case info is from an application section
            # (although it might filter out legitimate reservations in this series if dates don't match exactly).
            if reservation_id is None:
                continue

            period = cls._parse_code_valid_period(validity)

            access_code_validity.append(
                PindoraValidityInfoData(
                    reservation_id=reservation_id,
                    reservation_series_id=series.pk,
                    access_code_begins_at=period["access_code_begins_at"],
                    access_code_ends_at=period["access_code_ends_at"],
                )
            )

        return access_code_validity

    @classmethod
    def _parse_code_valid_period(cls, validity: PindoraAccessCodeValidity) -> PindoraAccessCodePeriod:
        """Calculate access code validity time based on reservation start time and validity buffers."""
        begin = validity["begin"]
        end = validity["end"]
        access_code_valid_minutes_before = validity["access_code_valid_minutes_before"]
        access_code_valid_minutes_after = validity["access_code_valid_minutes_after"]
        access_code_begins_at = begin - datetime.timedelta(minutes=access_code_valid_minutes_before)
        access_code_ends_at = end + datetime.timedelta(minutes=access_code_valid_minutes_after)

        return PindoraAccessCodePeriod(
            access_code_begins_at=access_code_begins_at,
            access_code_ends_at=access_code_ends_at,
        )
