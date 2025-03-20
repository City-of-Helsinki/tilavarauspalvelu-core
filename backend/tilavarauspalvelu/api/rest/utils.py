from __future__ import annotations

import dataclasses
import datetime
from functools import wraps
from typing import TYPE_CHECKING

from django.core.exceptions import ValidationError
from django.http import JsonResponse

if TYPE_CHECKING:
    from collections.abc import Callable

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "ReservationUnitParams",
    "StatisticsParams",
    "validate_pagination",
    "validation_error_as_response",
]


def validation_error_as_response[R, **P](func: Callable[P, R]) -> Callable[P, R]:
    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        try:
            return func(*args, **kwargs)
        except ValidationError as error:
            return JsonResponse({"detail": str(error.message), "code": error.code or ""}, status=400)

    return wrapper


@dataclasses.dataclass
class ReservationUnitParams:
    reservation_units: list[int]
    tprek_id: str
    updated_after: datetime.datetime | None
    updated_before: datetime.datetime | None

    @classmethod
    def from_request(cls, request: WSGIRequest) -> ReservationUnitParams:
        reservation_units = parse_list_of_pks(request, "only")
        updated_after = parse_datetime(request, "updated_after")
        updated_before = parse_datetime(request, "updated_before")
        tprek_id: str = str(request.GET.get("tprek_id", ""))

        return cls(
            reservation_units=reservation_units,
            tprek_id=tprek_id,
            updated_after=updated_after,
            updated_before=updated_before,
        )


@dataclasses.dataclass
class StatisticsParams:
    begins_after: datetime.datetime | None
    begins_before: datetime.datetime | None
    reservations: list[int]
    tprek_id: str

    @classmethod
    def from_request(cls, request: WSGIRequest) -> StatisticsParams:
        reservations = parse_list_of_pks(request, "only")
        begins_after = parse_datetime(request, "begins_after")
        begins_before = parse_datetime(request, "begins_before")
        tprek_id: str = str(request.GET.get("tprek_id", ""))

        return cls(
            begins_after=begins_after,
            begins_before=begins_before,
            reservations=reservations,
            tprek_id=tprek_id,
        )


def validate_pagination(request: WSGIRequest) -> tuple[int, int]:
    # Set max page size to avoid timeouts
    max_page_size = 100

    start = parse_int(request, "start", default=0)
    stop = parse_int(request, "stop", default=start + max_page_size)

    if start >= stop:
        msg = "'start' should be less than 'stop'."
        raise ValidationError(msg)

    if stop - start > max_page_size:
        msg = f"The difference between 'start' and 'stop' should be no more than {max_page_size}."
        raise ValidationError(msg)

    return start, stop


def parse_int(request: WSGIRequest, param: str, *, default: int) -> int:
    try:
        return int(request.GET.get(param, default))
    except (ValueError, TypeError) as error:
        msg = f"'{param}' should be an integer."
        raise ValidationError(msg) from error


def parse_list_of_pks(request: WSGIRequest, param: str) -> list[int]:
    try:
        return [int(pk) for pk in request.GET.get(param, "").split(",") if pk]
    except (ValueError, TypeError) as error:
        msg = f"'{param}' should be a comma separated list of integers."
        raise ValidationError(msg) from error


def parse_datetime(request: WSGIRequest, param: str) -> datetime.datetime | None:
    """Parse datetime from string"""
    # "+" is an escape char in URL params for a space, so replace it with "+" for the timezone info
    string_value: str = request.GET.get(param, "").replace(" ", "+")

    if not string_value:
        return None

    try:
        return datetime.datetime.fromisoformat(string_value)
    except (ValueError, TypeError) as error:
        msg = f"'{param}' should be ISO datetime strings."
        raise ValidationError(msg) from error
