from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Any

from django.conf import settings
from rest_framework.status import (
    HTTP_200_OK,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT,
)

from tilavarauspalvelu.enums import ReservationStateChoice
from utils.date_utils import local_iso_format
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from .exceptions import (
    PindoraAPIError,
    PindoraClientConfigurationError,
    PindoraClientError,
    PindoraUnexpectedResponseError,
)
from .typing import (
    PindoraReservationCreateData,
    PindoraReservationResponse,
    PindoraReservationSeriesAccessCodeValidity,
    PindoraReservationSeriesCreateData,
    PindoraReservationSeriesReservationData,
    PindoraReservationSeriesResponse,
    PindoraReservationSeriesUpdateData,
    PindoraReservationUnitResponse,
    PindoraSeasonalBookingAccessCodeValidity,
    PindoraSeasonalBookingCreateData,
    PindoraSeasonalBookingReservationData,
    PindoraSeasonalBookingResponse,
    PindoraSeasonalBookingUpdateData,
    PindoraUpdateReservationData,
)

if TYPE_CHECKING:
    from requests import Response

    from tilavarauspalvelu.models import ApplicationSection, RecurringReservation, Reservation, ReservationUnit

__all__ = [
    "PindoraClient",
]


class PindoraClient(BaseExternalServiceClient):
    """Client for the Pindora-Tilavaraus API."""

    SERVICE_NAME = "Pindora"
    REQUEST_TIMEOUT_SECONDS = 10

    ####################
    # Reservation unit #
    ####################

    @classmethod
    def get_reservation_unit(cls, reservation_unit: ReservationUnit) -> PindoraReservationUnitResponse:
        """Get a reservation unit from Pindora."""
        url = cls._build_url(f"reservation-unit/{reservation_unit.uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_unit_response(
            response,
            reservation_unit,
            action="fetching reservation unit",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_unit_response(data)

    ######################
    # Single reservation #
    ######################

    @classmethod
    def get_reservation(cls, reservation: Reservation) -> PindoraReservationResponse:
        """Fetch a reservation from Pindora."""
        url = cls._build_url(f"reservation-unit/{reservation.ext_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_response(
            response,
            reservation,
            action="fetching reservation",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

    @classmethod
    def create_reservation(cls, reservation: Reservation, *, is_active: bool = False) -> PindoraReservationResponse:
        """Create a new reservation in Pindora."""
        url = cls._build_url("reservations")

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
            reservation,
            action="creating reservation",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

    @classmethod
    def update_reservation(cls, reservation: Reservation, *, is_active: bool = False) -> None:
        """Update a reservation in Pindora."""
        url = cls._build_url(f"reservation/{reservation.ext_uuid}")

        data = PindoraUpdateReservationData(
            begin=local_iso_format(reservation.begin),
            end=local_iso_format(reservation.end),
            is_active=is_active,
        )

        response = cls.put(url=url, json=data)
        cls._validate_reservation_response(
            response,
            reservation,
            action="updating reservation",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def delete_reservation(cls, reservation: Reservation) -> None:
        """Delete a reservation from Pindora."""
        url = cls._build_url(f"reservation/{reservation.ext_uuid}")

        response = cls.delete(url=url)
        cls._validate_reservation_response(
            response,
            reservation,
            action="deleting reservation",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def change_reservation_access_code(cls, reservation: Reservation) -> PindoraReservationResponse:
        """Change a reservation's access code in Pindora."""
        url = cls._build_url(f"change-access-code/reservation/{reservation.ext_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_response(
            response,
            reservation,
            action="changing access code for reservation",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

    ####################
    # Seasonal booking #
    ####################

    @classmethod
    def get_seasonal_booking(cls, application_section: ApplicationSection) -> PindoraSeasonalBookingResponse:
        """Fetch a seasonal booking from Pindora."""
        url = cls._build_url(f"seasonal-booking/{application_section.ext_uuid}")

        response = cls.get(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section,
            action="fetching seasonal booking",
        )

        data = cls.response_json(response)
        return cls._parse_seasonal_booking_response(data)

    @classmethod
    def create_seasonal_booking(
        cls,
        application_section: ApplicationSection,
        *,
        is_active: bool = False,
    ) -> PindoraSeasonalBookingResponse:
        """Create a new seasonal booking in Pindora."""
        url = cls._build_url("seasonal-bookings")

        reservations: list[Reservation] = list(
            application_section.actions.get_reservations()
            .filter(state=ReservationStateChoice.CONFIRMED)
            .select_related("recurring_reservation__reservation_unit")
        )

        if not reservations:
            msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraSeasonalBookingCreateData(
            seasonal_booking_id=str(application_section.ext_uuid),
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
            application_section,
            action="creating seasonal booking",
        )

        data = cls.response_json(response)
        return cls._parse_seasonal_booking_response(data)

    @classmethod
    def update_seasonal_reservation(
        cls,
        application_section: ApplicationSection,
        *,
        is_active: bool = False,
    ) -> None:
        """Update a seasonal booking in Pindora."""
        url = cls._build_url(f"seasonal-booking/{application_section.ext_uuid}")

        reservations: list[Reservation] = list(
            application_section.actions.get_reservations()
            .filter(state=ReservationStateChoice.CONFIRMED)
            .select_related("recurring_reservation__reservation_unit")
        )

        if not reservations:
            msg = f"No confirmed reservations in seasonal booking '{application_section.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraSeasonalBookingUpdateData(
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

        response = cls.put(url=url, json=data)
        cls._validate_seasonal_booking_response(
            response,
            application_section,
            action="updating seasonal booking",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def delete_seasonal_booking(
        cls,
        application_section: ApplicationSection,
    ) -> None:
        """Delete a seasonal booking from Pindora."""
        url = cls._build_url(f"seasonal-booking/{application_section.ext_uuid}")

        response = cls.delete(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section,
            action="deleting seasonal booking",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def change_seasonal_booking_access_code(
        cls,
        application_section: ApplicationSection,
    ) -> PindoraSeasonalBookingResponse:
        """Change a seasonal booking's access code in Pindora."""
        url = cls._build_url(f"change-access-code/seasonal-booking/{application_section.ext_uuid}")

        response = cls.put(url=url)
        cls._validate_seasonal_booking_response(
            response,
            application_section,
            action="changing access code for seasonal booking",
        )

        data = cls.response_json(response)
        return cls._parse_seasonal_booking_response(data)

    ######################
    # Reservation series #
    ######################

    @classmethod
    def get_reservation_series(cls, series: RecurringReservation) -> PindoraReservationSeriesResponse:
        """Fetch a reservation series from Pindora."""
        url = cls._build_url(f"reservation-serie/{series.ext_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_series_response(
            response,
            series,
            action="fetching reservation series",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_series_response(data)

    @classmethod
    def create_reservation_series(
        cls,
        series: RecurringReservation,
        *,
        is_active: bool = False,
    ) -> PindoraReservationSeriesResponse:
        """Create a new reservation series in Pindora."""
        url = cls._build_url("reservation-series")

        reservations: list[Reservation] = list(series.reservations.filter(state=ReservationStateChoice.CONFIRMED))

        if not reservations:
            msg = f"No confirmed reservations in reservation series '{series.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraReservationSeriesCreateData(
            reservation_serie_id=str(series.ext_uuid),
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
            series,
            action="creating reservation series",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_series_response(data)

    @classmethod
    def update_reservation_series(
        cls,
        series: RecurringReservation,
        *,
        is_active: bool = False,
    ) -> None:
        """Create a new reservation series in Pindora."""
        url = cls._build_url(f"reservation-serie/{series.ext_uuid}")

        reservations: list[Reservation] = list(series.reservations.filter(state=ReservationStateChoice.CONFIRMED))

        if not reservations:
            msg = f"No confirmed reservations in reservation series '{series.ext_uuid}'."
            raise PindoraClientError(msg)

        data = PindoraReservationSeriesUpdateData(
            series=[
                PindoraReservationSeriesReservationData(
                    begin=local_iso_format(reservation.begin),
                    end=local_iso_format(reservation.end),
                )
                for reservation in reservations
            ],
            is_active=is_active,
        )

        response = cls.put(url=url, json=data)
        cls._validate_reservation_series_response(
            response,
            series,
            action="updating reservation series",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def delete_reservation_series(
        cls,
        series: RecurringReservation,
    ) -> None:
        """Delete a reservation series from Pindora."""
        url = cls._build_url(f"reservation-serie/{series.ext_uuid}")

        response = cls.delete(url=url)
        cls._validate_reservation_series_response(
            response,
            series,
            action="deleting reservation series",
            expected_status_code=HTTP_204_NO_CONTENT,
        )

    @classmethod
    def change_reservation_series_access_code(
        cls,
        series: RecurringReservation,
    ) -> PindoraReservationSeriesResponse:
        """Change a reservation series' access code in Pindora."""
        url = cls._build_url(f"change-access-code/reservation-serie/{series.ext_uuid}")

        response = cls.put(url=url)
        cls._validate_reservation_series_response(
            response,
            series,
            action="changing access code for reservation series",
        )

        data = cls.response_json(response)
        return cls._parse_reservation_series_response(data)

    ##################
    # Helper methods #
    ##################

    @classmethod
    def _parse_reservation_unit_response(cls, data: dict[str, Any]) -> PindoraReservationUnitResponse:
        try:
            return PindoraReservationUnitResponse(
                reservation_unit_id=uuid.UUID(data["reservation_unit_id"]),
                name=data["name"],
                keypad_url=data["keypad_url"],
            )

        except KeyError as error:
            msg = f"Missing key in reservation unit response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

        except (ValueError, TypeError) as error:
            msg = f"Invalid value in reservation unit response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

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
            msg = f"Missing key in reservation response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

        except (ValueError, TypeError) as error:
            msg = f"Invalid value in reservation response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

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
            msg = f"Missing key in seasonal booking response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

        except (ValueError, TypeError) as error:
            msg = f"Invalid value in seasonal booking response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

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
            msg = f"Missing key in reservation series response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

        except (ValueError, TypeError) as error:
            msg = f"Invalid value in reservation series response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

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
    def _validate_reservation_unit_response(
        cls,
        response: Response,
        reservation_unit: ReservationUnit,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation unit responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation unit '{reservation_unit.uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=reservation_unit.uuid,
                status_code=response.status_code,
                text=response.text,
            )

    @classmethod
    def _validate_reservation_response(
        cls,
        response: Response,
        reservation: Reservation,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

        if response.status_code == HTTP_409_CONFLICT:
            msg = f"Reservation '{reservation.ext_uuid}' already exists in Pindora."
            raise PindoraAPIError(msg)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=reservation.ext_uuid,
                status_code=response.status_code,
                text=response.text,
            )

    @classmethod
    def _validate_seasonal_booking_response(
        cls,
        response: Response,
        application_section: ApplicationSection,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in seasonal booking responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Seasonal booking '{application_section.ext_uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

        if response.status_code == HTTP_409_CONFLICT:
            msg = f"Seasonal booking '{application_section.ext_uuid}' already exists in Pindora."
            raise PindoraAPIError(msg)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=application_section.ext_uuid,
                status_code=response.status_code,
                text=response.text,
            )

    @classmethod
    def _validate_reservation_series_response(
        cls,
        response: Response,
        series: RecurringReservation,
        *,
        action: str,
        expected_status_code: int = HTTP_200_OK,
    ) -> None:
        """Handle errors in reservation series responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation series '{series.ext_uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

        if response.status_code == HTTP_409_CONFLICT:
            msg = f"Reservation series '{series.ext_uuid}' already exists in Pindora."
            raise PindoraAPIError(msg)

        if response.status_code != expected_status_code:
            raise PindoraUnexpectedResponseError(
                action=action,
                uuid=series.ext_uuid,
                status_code=response.status_code,
                text=response.text,
            )

    @classmethod
    def _validate_response(cls, response: Response) -> None:
        """Handle common errors in Pindora API responses."""
        if response.status_code == HTTP_403_FORBIDDEN:
            msg = "Pindora API key is invalid."
            raise PindoraAPIError(msg)

        if response.status_code == HTTP_400_BAD_REQUEST:
            msg = f"Invalid Pindora API request: {response.text}."
            raise PindoraAPIError(msg)
