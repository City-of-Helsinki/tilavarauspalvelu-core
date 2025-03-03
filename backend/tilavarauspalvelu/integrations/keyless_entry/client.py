from __future__ import annotations

import datetime
import json
import uuid
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.cache import cache
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
)

from utils.date_utils import local_iso_format
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from .exceptions import (
    PindoraBadRequestError,
    PindoraClientConfigurationError,
    PindoraClientError,
    PindoraConflictError,
    PindoraInvalidValueError,
    PindoraMissingKeyError,
    PindoraNotFoundError,
    PindoraPermissionError,
    PindoraUnexpectedResponseError,
)
from .typing import (
    PindoraAccessCodeModifyResponse,
    PindoraReservationCreateData,
    PindoraReservationRescheduleData,
    PindoraReservationResponse,
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesCreateData,
    PindoraReservationSeriesRescheduleData,
    PindoraReservationSeriesReservationData,
    PindoraReservationSeriesResponse,
    PindoraReservationUnitResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingCreateData,
    PindoraSeasonalBookingRescheduleData,
    PindoraSeasonalBookingReservationData,
    PindoraSeasonalBookingResponse,
)

if TYPE_CHECKING:
    from requests import Response

    from tilavarauspalvelu.models import ApplicationSection, RecurringReservation, Reservation, ReservationUnit

__all__ = [
    "PindoraClient",
]


class BasePindoraClient(BaseExternalServiceClient):
    SERVICE_NAME = "Pindora"
    REQUEST_TIMEOUT_SECONDS = 10

    @classmethod
    def _build_url(cls, endpoint: str) -> str:
        if not settings.PINDORA_API_URL:
            raise PindoraClientConfigurationError(config="PINDORA_API_URL")

        base_url = settings.PINDORA_API_URL.removesuffix("/")
        return f"{base_url}/{endpoint}"

    @classmethod
    def _get_headers(cls, headers: dict[str, Any] | None) -> dict[str, str]:
        if not settings.PINDORA_API_KEY:
            raise PindoraClientConfigurationError(config="PINDORA_API_KEY")

        return {
            "Pindora-Api-Key": str(settings.PINDORA_API_KEY),
            "Accept": "application/vdn.varaamo-pindora.v1+json",
            **(headers or {}),
        }

    @classmethod
    def _cache_response(cls, data: dict[str, Any], *, ext_uuid: uuid.UUID, prefix: str) -> str:
        cache_key = cls._cache_key(ext_uuid=ext_uuid, prefix=prefix)
        cache_data = json.dumps(data, default=str)
        cache.set(cache_key, cache_data, timeout=30)
        return cache_data

    @classmethod
    def _get_cached_response(cls, *, ext_uuid: uuid.UUID, prefix: str) -> dict[str, Any] | None:
        cache_key = cls._cache_key(ext_uuid=ext_uuid, prefix=prefix)
        cached_data = cache.get(cache_key)
        if cached_data is None:
            return None
        return json.loads(cached_data)

    @classmethod
    def _clear_cached_response(cls, *, ext_uuid: uuid.UUID, prefix: str) -> bool:
        cache_key = cls._cache_key(ext_uuid=ext_uuid, prefix=prefix)
        return cache.delete(cache_key)

    @classmethod
    def _cache_key(cls, *, ext_uuid: uuid.UUID, prefix: str) -> str:
        return f"pindora:{prefix}:{ext_uuid}"

    @classmethod
    def _parse_access_code_modify_response(cls, data: dict[str, Any]) -> PindoraAccessCodeModifyResponse:
        try:
            return PindoraAccessCodeModifyResponse(
                access_code_generated_at=datetime.datetime.fromisoformat(data["access_code_generated_at"]),
                access_code_is_active=bool(data["access_code_is_active"]),
            )
        except KeyError as error:
            raise PindoraMissingKeyError(entity="reservation", key=error) from error

        except (ValueError, TypeError) as error:
            raise PindoraInvalidValueError(entity="reservation", error=error) from error

    @classmethod
    def _validate_response(cls, response: Response) -> None:
        """Handle common errors in Pindora API responses."""
        if response.status_code == HTTP_403_FORBIDDEN:
            raise PindoraPermissionError

        if response.status_code == HTTP_400_BAD_REQUEST:
            raise PindoraBadRequestError(text=response.text)


class PindoraReservationUnitClient(BasePindoraClient):
    """Pindora client for working with reservation units."""

    @classmethod
    def get_reservation_unit(cls, reservation_unit: ReservationUnit | uuid.UUID) -> PindoraReservationUnitResponse:
        """Get a reservation unit from Pindora."""
        reservation_unit_uuid = reservation_unit if isinstance(reservation_unit, uuid.UUID) else reservation_unit.uuid

        response = cls._get_cached_reservation_unit_response(ext_uuid=reservation_unit_uuid)
        if response is not None:
            return response

        url = cls._build_url(f"reservation-unit/{reservation_unit_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_unit_response(
            response,
            reservation_unit_uuid=reservation_unit_uuid,
            action="fetching reservation unit",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_reservation_unit_response(data)
        cls._cache_reservation_unit_response(data=data, ext_uuid=reservation_unit_uuid)
        return parsed_data

    # ----------------------------------------------------------------------------------------------------------------

    @classmethod
    def _cache_reservation_unit_response(cls, data: PindoraReservationUnitResponse, *, ext_uuid: uuid.UUID) -> str:
        return cls._cache_response(data, ext_uuid=ext_uuid, prefix="reservation-unit")

    @classmethod
    def _get_cached_reservation_unit_response(cls, *, ext_uuid: uuid.UUID) -> PindoraReservationUnitResponse | None:
        data = cls._get_cached_response(ext_uuid=ext_uuid, prefix="reservation-unit")
        if data is None:
            return None
        return cls._parse_reservation_unit_response(data)

    @classmethod
    def _clear_cached_reservation_unit_response(cls, *, ext_uuid: uuid.UUID) -> bool:
        return cls._clear_cached_response(ext_uuid=ext_uuid, prefix="reservation-unit")

    @classmethod
    def _parse_reservation_unit_response(cls, data: dict[str, Any]) -> PindoraReservationUnitResponse:
        try:
            return PindoraReservationUnitResponse(
                reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
                name=data["name"],
                keypad_url=data["keypad_url"],
            )

        except KeyError as error:
            raise PindoraMissingKeyError(entity="reservation unit", key=error) from error

        except (ValueError, TypeError) as error:
            raise PindoraInvalidValueError(entity="reservation unit", error=error) from error

    @classmethod
    def _validate_reservation_unit_response(
        cls,
        response: Response,
        reservation_unit_uuid: uuid.UUID,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation unit responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            raise PindoraNotFoundError(entity="Reservation unit", uuid=reservation_unit_uuid)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=reservation_unit_uuid,
                status_code=response.status_code,
                text=response.text,
            )


class PindoraReservationClient(BasePindoraClient):
    """Pindora client for working with reservations"""

    @classmethod
    def get_reservation(cls, reservation: Reservation | uuid.UUID) -> PindoraReservationResponse:
        """Fetch a reservation from Pindora."""
        reservation_uuid = reservation if isinstance(reservation, uuid.UUID) else reservation.ext_uuid

        response = cls._get_cached_reservation_response(ext_uuid=reservation_uuid)
        if response is not None:
            return response

        url = cls._build_url(f"reservation/{reservation_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation_uuid,
            action="fetching reservation",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_reservation_response(data)
        cls._cache_reservation_response(parsed_data, ext_uuid=reservation_uuid)
        return parsed_data

    @classmethod
    def create_reservation(cls, reservation: Reservation, *, is_active: bool = False) -> PindoraReservationResponse:
        """Create a new reservation in Pindora."""
        url = cls._build_url("reservation")

        reservation_unit: ReservationUnit = reservation.reservation_units.first()

        data = PindoraReservationCreateData(
            reservation_id=str(reservation.ext_uuid),
            reservation_unit_id=str(reservation_unit.uuid),
            begin=local_iso_format(reservation.begin),
            end=local_iso_format(reservation.end),
            is_active=is_active,
        )

        response = cls.post(url=url, json=data)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation.ext_uuid,
            action="creating reservation",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_reservation_response(data)
        cls._cache_reservation_response(parsed_data, ext_uuid=reservation.ext_uuid)
        return parsed_data

    @classmethod
    def reschedule_reservation(
        cls, reservation: Reservation, *, is_active: bool = ...
    ) -> PindoraAccessCodeModifyResponse:
        """Reschedule a reservation in Pindora."""
        url = cls._build_url(f"reservation/reschedule/{reservation.ext_uuid}")

        data = PindoraReservationRescheduleData(
            begin=local_iso_format(reservation.begin),
            end=local_iso_format(reservation.end),
        )
        if is_active is not ...:
            data["is_active"] = is_active

        response = cls.put(url=url, json=data)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation.ext_uuid,
            action="rescheduling reservation",
            expected_status_code=HTTP_200_OK,
        )

        cls._clear_cached_reservation_response(ext_uuid=reservation.ext_uuid)

        data = cls.response_json(response)
        return cls._parse_access_code_modify_response(data)

    @classmethod
    def change_reservation_access_code(cls, reservation: Reservation | uuid.UUID) -> PindoraAccessCodeModifyResponse:
        """Change a reservation's access code in Pindora."""
        reservation_uuid = reservation if isinstance(reservation, uuid.UUID) else reservation.ext_uuid

        url = cls._build_url(f"reservation/change-access-code/{reservation_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation_uuid,
            action="changing access code for reservation",
            expected_status_code=HTTP_200_OK,
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_access_code_modify_response(data)
        cls._update_cached_reservation_response(parsed_data, ext_uuid=reservation_uuid)
        return parsed_data

    @classmethod
    def activate_reservation_access_code(cls, reservation: Reservation | uuid.UUID) -> None:
        """Activate a reservation's access code in Pindora."""
        reservation_uuid = reservation if isinstance(reservation, uuid.UUID) else reservation.ext_uuid

        url = cls._build_url(f"reservation/activate/{reservation_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation_uuid,
            action="activating access code for reservation",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_response(ext_uuid=reservation_uuid)

    @classmethod
    def deactivate_reservation_access_code(cls, reservation: Reservation | uuid.UUID) -> None:
        """Deactivate a reservation's access code in Pindora."""
        reservation_uuid = reservation if isinstance(reservation, uuid.UUID) else reservation.ext_uuid

        url = cls._build_url(f"reservation/deactivate/{reservation_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation_uuid,
            action="deactivating access code for reservation",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_response(ext_uuid=reservation_uuid)

    @classmethod
    def delete_reservation(cls, reservation: Reservation | uuid.UUID) -> None:
        """Delete a reservation from Pindora."""
        reservation_uuid = reservation if isinstance(reservation, uuid.UUID) else reservation.ext_uuid

        url = cls._build_url(f"reservation/{reservation_uuid}")

        response = cls.delete(url=url)
        cls._validate_reservation_response(
            response,
            reservation_uuid=reservation_uuid,
            action="deleting reservation",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_response(ext_uuid=reservation_uuid)

    # ----------------------------------------------------------------------------------------------------------------

    @classmethod
    def _cache_reservation_response(cls, data: PindoraReservationResponse, *, ext_uuid: uuid.UUID) -> str:
        return cls._cache_response(data, ext_uuid=ext_uuid, prefix="reservation")

    @classmethod
    def _update_cached_reservation_response(
        cls,
        data: PindoraAccessCodeModifyResponse,
        *,
        ext_uuid: uuid.UUID,
    ) -> None:
        cached_data = cls._get_cached_reservation_response(ext_uuid=ext_uuid)
        if cached_data is None:
            return

        cached_data.update(data)
        cls._cache_reservation_response(cached_data, ext_uuid=ext_uuid)

    @classmethod
    def _get_cached_reservation_response(cls, *, ext_uuid: uuid.UUID) -> PindoraReservationResponse | None:
        data = cls._get_cached_response(ext_uuid=ext_uuid, prefix="reservation")
        if data is None:
            return None
        return cls._parse_reservation_response(data)

    @classmethod
    def _clear_cached_reservation_response(cls, *, ext_uuid: uuid.UUID) -> bool:
        return cls._clear_cached_response(ext_uuid=ext_uuid, prefix="reservation")

    @classmethod
    def _parse_reservation_response(cls, data: dict[str, Any]) -> PindoraReservationResponse:
        try:
            return PindoraReservationResponse(
                reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
                access_code=data["access_code"],
                access_code_keypad_url=data["access_code_keypad_url"],
                access_code_phone_number=data["access_code_phone_number"],
                access_code_sms_number=data["access_code_sms_number"],
                access_code_sms_message=data["access_code_sms_message"],
                access_code_valid_minutes_before=int(data["access_code_valid_minutes_before"]),
                access_code_valid_minutes_after=int(data["access_code_valid_minutes_after"]),
                access_code_generated_at=datetime.datetime.fromisoformat(data["access_code_generated_at"]),
                access_code_is_active=bool(data["access_code_is_active"]),
                begin=datetime.datetime.fromisoformat(data["begin"]),
                end=datetime.datetime.fromisoformat(data["end"]),
            )

        except KeyError as error:
            raise PindoraMissingKeyError(entity="reservation", key=error) from error

        except (ValueError, TypeError) as error:
            raise PindoraInvalidValueError(entity="reservation", error=error) from error

    @classmethod
    def _validate_reservation_response(
        cls,
        response: Response,
        reservation_uuid: uuid.UUID,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            raise PindoraNotFoundError(entity="Reservation", uuid=reservation_uuid)

        if response.status_code == HTTP_409_CONFLICT:
            raise PindoraConflictError(entity="Reservation", uuid=reservation_uuid)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=reservation_uuid,
                status_code=response.status_code,
                text=response.text,
            )


class PindoraSeasonalBookingClient(BasePindoraClient):
    """Pindora client for working with seasonal bookings (application sections)"""

    @classmethod
    def get_seasonal_booking(cls, section: ApplicationSection | uuid.UUID) -> PindoraSeasonalBookingResponse:
        """Fetch a seasonal booking from Pindora."""
        section_uuid = section if isinstance(section, uuid.UUID) else section.ext_uuid

        response = cls._get_cached_seasonal_booking_response(ext_uuid=section_uuid)
        if response is not None:
            return response

        url = cls._build_url(f"seasonal-booking/{section_uuid}")

        response = cls.get(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section_uuid,
            action="fetching seasonal booking",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_seasonal_booking_response(data)
        cls._cache_seasonal_booking_response(parsed_data, ext_uuid=section_uuid)
        return parsed_data

    @classmethod
    def create_seasonal_booking(
        cls,
        section: ApplicationSection,
        *,
        is_active: bool = True,
    ) -> PindoraSeasonalBookingResponse:
        """Create a new seasonal booking in Pindora."""
        url = cls._build_url("seasonal-booking")

        reservations: list[Reservation] = list(
            section.actions.get_reservations()
            .requires_active_access_code()
            .select_related("recurring_reservation__reservation_unit")
        )

        if not reservations:
            msg = f"No reservations require an access code in seasonal booking '{section.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraSeasonalBookingCreateData(
            seasonal_booking_id=str(section.ext_uuid),
            series=[
                PindoraSeasonalBookingReservationData(
                    reservation_unit_id=str(reservation.recurring_reservation.reservation_unit.uuid),
                    begin=local_iso_format(reservation.begin),
                    end=local_iso_format(reservation.end),
                )
                for reservation in reservations
            ],
            is_active=is_active,
        )

        response = cls.post(url=url, json=data)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section.ext_uuid,
            action="creating seasonal booking",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_seasonal_booking_response(data)
        cls._cache_seasonal_booking_response(parsed_data, ext_uuid=section.ext_uuid)
        return parsed_data

    @classmethod
    def reschedule_seasonal_booking(cls, section: ApplicationSection) -> PindoraAccessCodeModifyResponse:
        """Reschedule a seasonal booking in Pindora."""
        url = cls._build_url(f"seasonal-booking/reschedule/{section.ext_uuid}")

        # This only selects confirmed non-blocking reservations.
        reservations: list[Reservation] = list(
            section.actions.get_reservations()
            .requires_active_access_code()
            .select_related("recurring_reservation__reservation_unit")
        )

        if not reservations:
            msg = f"No confirmed reservations in seasonal booking '{section.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraSeasonalBookingRescheduleData(
            series=[
                PindoraSeasonalBookingReservationData(
                    reservation_unit_id=str(reservation.recurring_reservation.reservation_unit.uuid),
                    begin=local_iso_format(reservation.begin),
                    end=local_iso_format(reservation.end),
                )
                for reservation in reservations
            ],
        )

        response = cls.put(url=url, json=data)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section.ext_uuid,
            action="rescheduling seasonal booking",
            expected_status_code=HTTP_200_OK,
        )

        cls._clear_cached_seasonal_booking_response(ext_uuid=section.ext_uuid)

        data = cls.response_json(response)
        return cls._parse_access_code_modify_response(data)

    @classmethod
    def change_seasonal_booking_access_code(
        cls,
        section: ApplicationSection | uuid.UUID,
    ) -> PindoraAccessCodeModifyResponse:
        """Change a seasonal booking's access code in Pindora."""
        section_uuid = section if isinstance(section, uuid.UUID) else section.ext_uuid

        url = cls._build_url(f"seasonal-booking/change-access-code/{section_uuid}")

        response = cls.put(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section_uuid,
            action="changing access code for seasonal booking",
            expected_status_code=HTTP_200_OK,
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_access_code_modify_response(data)
        cls._update_cached_seasonal_booking_response(parsed_data, ext_uuid=section_uuid)
        return parsed_data

    @classmethod
    def activate_seasonal_booking_access_code(cls, section: ApplicationSection | uuid.UUID) -> None:
        """Activate a seasonal booking's access code in Pindora."""
        section_uuid = section if isinstance(section, uuid.UUID) else section.ext_uuid

        url = cls._build_url(f"seasonal-booking/activate/{section_uuid}")

        response = cls.put(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section_uuid,
            action="activating access code for seasonal booking",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_seasonal_booking_response(ext_uuid=section_uuid)

    @classmethod
    def deactivate_seasonal_booking_access_code(cls, section: ApplicationSection | uuid.UUID) -> None:
        """Deactivate a seasonal booking's access code in Pindora."""
        section_uuid = section if isinstance(section, uuid.UUID) else section.ext_uuid

        url = cls._build_url(f"seasonal-booking/deactivate/{section_uuid}")

        response = cls.put(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section_uuid,
            action="deactivating access code for seasonal booking",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_seasonal_booking_response(ext_uuid=section_uuid)

    @classmethod
    def delete_seasonal_booking(cls, section: ApplicationSection | uuid.UUID) -> None:
        """Delete a seasonal booking from Pindora."""
        section_uuid = section if isinstance(section, uuid.UUID) else section.ext_uuid

        url = cls._build_url(f"seasonal-booking/{section_uuid}")

        response = cls.delete(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section_uuid=section_uuid,
            action="deleting seasonal booking",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_seasonal_booking_response(ext_uuid=section_uuid)

    # ----------------------------------------------------------------------------------------------------------------

    @classmethod
    def _cache_seasonal_booking_response(cls, data: PindoraSeasonalBookingResponse, *, ext_uuid: uuid.UUID) -> str:
        return cls._cache_response(data, ext_uuid=ext_uuid, prefix="seasonal-booking")

    @classmethod
    def _update_cached_seasonal_booking_response(
        cls,
        data: PindoraAccessCodeModifyResponse,
        *,
        ext_uuid: uuid.UUID,
    ) -> None:
        cached_data = cls._get_cached_seasonal_booking_response(ext_uuid=ext_uuid)
        if cached_data is None:
            return

        cached_data.update(data)
        cls._cache_seasonal_booking_response(cached_data, ext_uuid=ext_uuid)

    @classmethod
    def _get_cached_seasonal_booking_response(cls, *, ext_uuid: uuid.UUID) -> PindoraSeasonalBookingResponse | None:
        data = cls._get_cached_response(ext_uuid=ext_uuid, prefix="seasonal-booking")
        if data is None:
            return None
        return cls._parse_seasonal_booking_response(data)

    @classmethod
    def _clear_cached_seasonal_booking_response(cls, *, ext_uuid: uuid.UUID) -> bool:
        return cls._clear_cached_response(ext_uuid=ext_uuid, prefix="seasonal-booking")

    @classmethod
    def _parse_seasonal_booking_response(cls, data: dict[str, Any]) -> PindoraSeasonalBookingResponse:
        try:
            return PindoraSeasonalBookingResponse(
                access_code=data["access_code"],
                access_code_keypad_url=data["access_code_keypad_url"],
                access_code_phone_number=data["access_code_phone_number"],
                access_code_sms_number=data["access_code_sms_number"],
                access_code_sms_message=data["access_code_sms_message"],
                access_code_generated_at=datetime.datetime.fromisoformat(data["access_code_generated_at"]),
                access_code_is_active=bool(data["access_code_is_active"]),
                reservation_unit_code_validity=[
                    PindoraSeasonalBookingAccessCodeValidity(
                        reservation_unit_id=uuid.UUID(validity["reservation_unit_id"]),
                        access_code_valid_minutes_before=int(validity["access_code_valid_minutes_before"]),
                        access_code_valid_minutes_after=int(validity["access_code_valid_minutes_after"]),
                        begin=datetime.datetime.fromisoformat(validity["begin"]),
                        end=datetime.datetime.fromisoformat(validity["end"]),
                    )
                    for validity in data["reservation_unit_code_validity"]
                ],
            )

        except KeyError as error:
            raise PindoraMissingKeyError(entity="seasonal booking", key=error) from error

        except (ValueError, TypeError) as error:
            raise PindoraInvalidValueError(entity="seasonal booking", error=error) from error

    @classmethod
    def _validate_seasonal_booking_response(
        cls,
        response: Response,
        application_section_uuid: uuid.UUID,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in seasonal booking responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            raise PindoraNotFoundError(entity="Seasonal booking", uuid=application_section_uuid)

        if response.status_code == HTTP_409_CONFLICT:
            raise PindoraConflictError(entity="Seasonal booking", uuid=application_section_uuid)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=application_section_uuid,
                status_code=response.status_code,
                text=response.text,
            )


class PindoraReservationSeriesClient(BasePindoraClient):
    """Pindora client for working with reservation series (recurring reservations)"""

    @classmethod
    def get_reservation_series(cls, series: RecurringReservation | uuid.UUID) -> PindoraReservationSeriesResponse:
        """Fetch a reservation series from Pindora."""
        series_uuid = series if isinstance(series, uuid.UUID) else series.ext_uuid

        response = cls._get_cached_reservation_series_response(ext_uuid=series_uuid)
        if response is not None:
            return response

        url = cls._build_url(f"reservation-series/{series_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series_uuid,
            action="fetching reservation series",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_reservation_series_response(data)
        cls._cache_reservation_series_response(parsed_data, ext_uuid=series_uuid)
        return parsed_data

    @classmethod
    def create_reservation_series(
        cls,
        series: RecurringReservation,
        *,
        is_active: bool = True,
    ) -> PindoraReservationSeriesResponse:
        """Create a new reservation series in Pindora."""
        url = cls._build_url("reservation-series")

        reservations: list[Reservation] = list(series.reservations.requires_active_access_code())

        if not reservations:
            msg = f"No reservations require an access code in reservation series '{series.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraReservationSeriesCreateData(
            reservation_series_id=str(series.ext_uuid),
            reservation_unit_id=str(series.reservation_unit.uuid),
            series=[
                PindoraReservationSeriesReservationData(
                    begin=local_iso_format(reservation.begin),
                    end=local_iso_format(reservation.end),
                )
                for reservation in reservations
            ],
            is_active=is_active,
        )

        response = cls.post(url=url, json=data)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series.ext_uuid,
            action="creating reservation series",
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_reservation_series_response(data)
        cls._cache_reservation_series_response(parsed_data, ext_uuid=series.ext_uuid)
        return parsed_data

    @classmethod
    def reschedule_reservation_series(cls, series: RecurringReservation) -> PindoraAccessCodeModifyResponse:
        """Reschedule a reservation series in Pindora."""
        url = cls._build_url(f"reservation-series/reschedule/{series.ext_uuid}")

        # This only selects confirmed non-blocking reservations.
        reservations: list[Reservation] = list(series.reservations.requires_active_access_code())

        if not reservations:
            msg = f"No confirmed reservations in reservation series '{series.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraReservationSeriesRescheduleData(
            series=[
                PindoraReservationSeriesReservationData(
                    begin=local_iso_format(reservation.begin),
                    end=local_iso_format(reservation.end),
                )
                for reservation in reservations
            ],
        )

        response = cls.put(url=url, json=data)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series.ext_uuid,
            action="rescheduling reservation series",
            expected_status_code=HTTP_200_OK,
        )

        cls._clear_cached_reservation_series_response(ext_uuid=series.ext_uuid)

        data = cls.response_json(response)
        return cls._parse_access_code_modify_response(data)

    @classmethod
    def change_reservation_series_access_code(
        cls,
        series: RecurringReservation | uuid.UUID,
    ) -> PindoraAccessCodeModifyResponse:
        """Change a reservation series' access code in Pindora."""
        series_uuid = series if isinstance(series, uuid.UUID) else series.ext_uuid

        url = cls._build_url(f"reservation-series/change-access-code/{series_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series_uuid,
            action="changing access code for reservation series",
            expected_status_code=HTTP_200_OK,
        )

        data = cls.response_json(response)
        parsed_data = cls._parse_access_code_modify_response(data)
        cls._update_cached_reservation_series_response(parsed_data, ext_uuid=series_uuid)
        return parsed_data

    @classmethod
    def activate_reservation_series_access_code(cls, series: RecurringReservation | uuid.UUID) -> None:
        """Activate a reservation series' access code in Pindora."""
        series_uuid = series if isinstance(series, uuid.UUID) else series.ext_uuid

        url = cls._build_url(f"reservation-series/activate/{series_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series_uuid,
            action="activating access code for reservation series",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_series_response(ext_uuid=series_uuid)

    @classmethod
    def deactivate_reservation_series_access_code(cls, series: RecurringReservation | uuid.UUID) -> None:
        """Deactivate a reservation series' access code in Pindora."""
        series_uuid = series if isinstance(series, uuid.UUID) else series.ext_uuid

        url = cls._build_url(f"reservation-series/deactivate/{series_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series_uuid,
            action="deactivating access code for reservation series",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_series_response(ext_uuid=series_uuid)

    @classmethod
    def delete_reservation_series(cls, series: RecurringReservation | uuid.UUID) -> None:
        """Delete a reservation series from Pindora."""
        series_uuid = series if isinstance(series, uuid.UUID) else series.ext_uuid

        url = cls._build_url(f"reservation-series/{series_uuid}")

        response = cls.delete(url=url)
        cls._validate_reservation_series_response(
            response,
            series_uuid=series_uuid,
            action="deleting reservation series",
            expected_status_code=HTTP_204_NO_CONTENT,
        )
        cls._clear_cached_reservation_series_response(ext_uuid=series_uuid)

    # ----------------------------------------------------------------------------------------------------------------

    @classmethod
    def _cache_reservation_series_response(cls, data: PindoraReservationSeriesResponse, *, ext_uuid: uuid.UUID) -> str:
        return cls._cache_response(data, ext_uuid=ext_uuid, prefix="reservation-series")

    @classmethod
    def _update_cached_reservation_series_response(
        cls,
        data: PindoraAccessCodeModifyResponse,
        *,
        ext_uuid: uuid.UUID,
    ) -> None:
        cached_data = cls._get_cached_reservation_series_response(ext_uuid=ext_uuid)
        if cached_data is None:
            return

        cached_data.update(data)
        cls._cache_reservation_series_response(cached_data, ext_uuid=ext_uuid)

    @classmethod
    def _get_cached_reservation_series_response(cls, *, ext_uuid: uuid.UUID) -> PindoraReservationSeriesResponse | None:
        data = cls._get_cached_response(ext_uuid=ext_uuid, prefix="reservation-series")
        if data is None:
            return None
        return cls._parse_reservation_series_response(data)

    @classmethod
    def _clear_cached_reservation_series_response(cls, *, ext_uuid: uuid.UUID) -> bool:
        return cls._clear_cached_response(ext_uuid=ext_uuid, prefix="reservation-series")

    @classmethod
    def _parse_reservation_series_response(cls, data: dict[str, Any]) -> PindoraReservationSeriesResponse:
        try:
            return PindoraReservationSeriesResponse(
                reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
                access_code=data["access_code"],
                access_code_keypad_url=data["access_code_keypad_url"],
                access_code_phone_number=data["access_code_phone_number"],
                access_code_sms_number=data["access_code_sms_number"],
                access_code_sms_message=data["access_code_sms_message"],
                access_code_generated_at=datetime.datetime.fromisoformat(data["access_code_generated_at"]),
                access_code_is_active=bool(data["access_code_is_active"]),
                reservation_unit_code_validity=[
                    PindoraReservationSeriesAccessCodeValidity(
                        access_code_valid_minutes_before=int(validity["access_code_valid_minutes_before"]),
                        access_code_valid_minutes_after=int(validity["access_code_valid_minutes_after"]),
                        begin=datetime.datetime.fromisoformat(validity["begin"]),
                        end=datetime.datetime.fromisoformat(validity["end"]),
                    )
                    for validity in data["reservation_unit_code_validity"]
                ],
            )

        except KeyError as error:
            raise PindoraMissingKeyError(entity="reservation series", key=error) from error

        except (ValueError, TypeError) as error:
            raise PindoraInvalidValueError(entity="reservation series", error=error) from error

    @classmethod
    def _validate_reservation_series_response(
        cls,
        response: Response,
        series_uuid: uuid.UUID,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation series responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            raise PindoraNotFoundError(entity="Reservation series", uuid=series_uuid)

        if response.status_code == HTTP_409_CONFLICT:
            raise PindoraConflictError(entity="Reservation series", uuid=series_uuid)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=series_uuid,
                status_code=response.status_code,
                text=response.text,
            )


class PindoraClient(
    PindoraReservationUnitClient,
    PindoraReservationClient,
    PindoraSeasonalBookingClient,
    PindoraReservationSeriesClient,
):
    """Client for the Pindora-Tilavaraus API."""
