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
)

from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.base_external_service_client import BaseExternalServiceClient

from .exceptions import PindoraAPIConfigurationError, PindoraAPIError
from .typing import (
    PindoraReservationCreateData,
    PindoraReservationResponse,
    PindoraReservationUnitResponse,
    PindoraUpdateReservationTimeData,
)

if TYPE_CHECKING:
    from requests import Response

    from tilavarauspalvelu.models import Reservation, ReservationUnit


__all__ = [
    "PindoraClient",
]


class PindoraClient(BaseExternalServiceClient):
    """Client for the Pindora-Tilavaraus API."""

    SERVICE_NAME = "Pindora"
    REQUEST_TIMEOUT_SECONDS = 10

    @classmethod
    def get_reservation_unit(cls, reservation_unit: ReservationUnit) -> PindoraReservationUnitResponse:
        """Get reservation unit data in Pindora."""
        url = cls._build_url(f"reservation-unit/{reservation_unit.uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_unit_response(response, reservation_unit)

        if response.status_code != HTTP_200_OK:
            msg = (
                f"Unexpected response from Pindora when fetching reservation unit '{reservation_unit.uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

        data = cls.response_json(response)
        return cls._parse_reservation_unit_response(data)

    @classmethod
    def get_reservation(cls, reservation: Reservation) -> PindoraReservationResponse:
        """Get reservation data from Pindora."""
        url = cls._build_url(f"reservation-unit/{reservation.ext_uuid}")

        response = cls.get(url=url)
        cls._validate_reservation_response(response, reservation)

        if response.status_code != HTTP_200_OK:
            msg = (
                f"Unexpected response from Pindora when fetching reservation '{reservation.ext_uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

    @classmethod
    def create_reservation(cls, reservation: Reservation) -> PindoraReservationResponse:
        """Create a new reservation in Pindora."""
        reservation_unit: ReservationUnit = reservation.reservation_units.first()

        url = cls._build_url("reservations")
        data = PindoraReservationCreateData(
            reservation_id=str(reservation.ext_uuid),
            reservation_unit_id=str(reservation_unit.uuid),
            begin=reservation.begin.astimezone(DEFAULT_TIMEZONE).isoformat(),
            end=reservation.end.astimezone(DEFAULT_TIMEZONE).isoformat(),
        )

        response = cls.post(url=url, json=data)
        cls._validate_reservation_response(response, reservation)

        if response.status_code != HTTP_200_OK:
            msg = (
                f"Unexpected response from Pindora when creating reservation '{reservation.ext_uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

    @classmethod
    def update_reservation_time(cls, reservation: Reservation) -> None:
        """Update reservation time in Pindora."""
        url = cls._build_url(f"reservation/{reservation.ext_uuid}")

        data = PindoraUpdateReservationTimeData(
            begin=reservation.begin.astimezone(DEFAULT_TIMEZONE).isoformat(),
            end=reservation.end.astimezone(DEFAULT_TIMEZONE).isoformat(),
        )

        response = cls.put(url=url, json=data)
        cls._validate_reservation_response(response, reservation)

        if response.status_code != HTTP_204_NO_CONTENT:
            msg = (
                f"Unexpected response from Pindora when modifying time for reservation '{reservation.ext_uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

    @classmethod
    def delete_reservation(cls, reservation: Reservation) -> None:
        """Delete reservation from Pindora."""
        url = cls._build_url(f"reservation/{reservation.ext_uuid}")

        response = cls.delete(url=url)
        cls._validate_reservation_response(response, reservation)

        if response.status_code != HTTP_204_NO_CONTENT:
            msg = (
                f"Unexpected response from Pindora when deleting reservation '{reservation.ext_uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

    @classmethod
    def change_reservation_access_code(cls, reservation: Reservation) -> PindoraReservationResponse:
        """Change reservation access code in Pindora."""
        url = cls._build_url(f"change-access-code/reservation/{reservation.ext_uuid}")

        response = cls.put(url=url)
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

        if response.status_code != HTTP_200_OK:
            msg = (
                f"Unexpected response from Pindora when changing access code for reservation '{reservation.ext_uuid}': "
                f"[{response.status_code}] {response.text}"
            )
            raise PindoraAPIError(msg)

        data = cls.response_json(response)
        return cls._parse_reservation_response(data)

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

        except ValueError as error:
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
                access_code_valid_minutes_before=data["access_code_valid_minutes_before"],
                access_code_valid_minutes_after=data["access_code_valid_minutes_after"],
                access_code_generated_at=datetime.datetime.fromisoformat(data["access_code_generated_at"]),
                begin=datetime.datetime.fromisoformat(data["begin"]),
                end=datetime.datetime.fromisoformat(data["end"]),
            )

        except KeyError as error:
            msg = f"Missing key in reservation response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

        except ValueError as error:
            msg = f"Invalid value in reservation response from Pindora: {error}"
            raise PindoraAPIError(msg) from error

    @classmethod
    def _build_url(cls, endpoint: str) -> str:
        if not settings.PINDORA_API_URL:
            msg = "'PINDORA_API_URL' environment variable must to be configured."
            raise PindoraAPIConfigurationError(msg)

        base_url = settings.PINDORA_API_URL.removesuffix("/")
        return f"{base_url}/{endpoint}"

    @classmethod
    def _get_headers(cls, headers: dict[str, Any] | None) -> dict[str, str]:
        if not settings.PINDORA_API_KEY:
            msg = "'PINDORA_API_KEY' environment variable must to be configured."
            raise PindoraAPIConfigurationError(msg)

        return {
            "Pindora-Api-Key": str(settings.PINDORA_API_KEY),
            "Accept": "application/vdn.varaamo-pindora.v1+json",
            **(headers or {}),
        }

    @classmethod
    def _validate_reservation_response(cls, response: Response, reservation: Reservation) -> None:
        """Handle errors in reservation responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation '{reservation.ext_uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

    @classmethod
    def _validate_reservation_unit_response(cls, response: Response, reservation_unit: ReservationUnit) -> None:
        """Handle errors in reservation unit responses."""
        cls._validate_response(response)

        if response.status_code == HTTP_404_NOT_FOUND:
            msg = f"Reservation unit '{reservation_unit.uuid}' not found from Pindora."
            raise PindoraAPIError(msg)

    @classmethod
    def _validate_response(cls, response: Response) -> None:
        """Handle common errors in Pindora API responses."""
        if response.status_code == HTTP_403_FORBIDDEN:
            msg = "Pindora API key is invalid."
            raise PindoraAPIError(msg)

        if response.status_code == HTTP_400_BAD_REQUEST:
            msg = f"Invalid Pindora API request: {response.text}."
            raise PindoraAPIError(msg)
