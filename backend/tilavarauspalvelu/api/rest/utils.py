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

    @classmethod
    def from_request(cls, request: WSGIRequest) -> ReservationUnitParams:
        try:
            reservation_units = [int(pk) for pk in request.GET.get("only", "").split(",") if pk]
        except (ValueError, TypeError) as error:
            msg = "'only' should be a comma separated list of reservation unit ids."
            raise ValidationError(msg) from error

        tprek_id: str = str(request.GET.get("tprek_id", ""))

        return cls(
            reservation_units=reservation_units,
            tprek_id=tprek_id,
        )


@dataclasses.dataclass
class StatisticsParams:
    begins_after: datetime.datetime | None
    begins_before: datetime.datetime | None
    reservations: list[int]
    tprek_id: str

    @classmethod
    def from_request(cls, request: WSGIRequest) -> StatisticsParams:
        try:
            reservations: list[int] = [int(pk) for pk in request.GET.get("only", "").split(",") if pk]
        except (ValueError, TypeError) as error:
            msg = "'only' should be a comma separated list of reservation ids."
            raise ValidationError(msg) from error

        # "+" is an escape char in URL params for a space, so replace it with "+" for the timezone info
        begins_after_str: str = request.GET.get("begins_after", "").replace(" ", "+")
        begins_before_str: str = request.GET.get("begins_before", "").replace(" ", "+")
        begins_after: datetime.datetime | None = None
        begins_before: datetime.datetime | None = None

        if begins_after_str:
            try:
                begins_after = datetime.datetime.fromisoformat(begins_after_str)
            except (ValueError, TypeError) as error:
                msg = "'begins_after' should be a ISO datetime string."
                raise ValidationError(msg) from error

        if begins_before_str:
            try:
                begins_before = datetime.datetime.fromisoformat(begins_before_str)
            except (ValueError, TypeError) as error:
                msg = "'begins_before' should be a ISO datetime string."
                raise ValidationError(msg) from error

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

    try:
        start = int(request.GET.get("start", 0))
    except (ValueError, TypeError) as error:
        msg = "'start' should be a number."
        raise ValidationError(msg) from error

    try:
        stop = int(request.GET.get("stop", start + max_page_size))
    except (ValueError, TypeError) as error:
        msg = "'stop' should be a number."
        raise ValidationError(msg) from error

    if start >= stop:
        msg = "'start' should be less than 'stop'."
        raise ValidationError(msg)

    if stop - start > max_page_size:
        msg = f"The difference between 'start' and 'stop' should be no more than {max_page_size}."
        raise ValidationError(msg)

    return start, stop
