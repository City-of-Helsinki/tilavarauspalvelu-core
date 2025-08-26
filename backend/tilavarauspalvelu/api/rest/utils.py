from __future__ import annotations

import dataclasses
import datetime
import uuid
from functools import cache, wraps
from http import HTTPStatus
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError
from django.core.validators import URLValidator
from django.http import HttpRequest, HttpResponseRedirect, JsonResponse
from import_export.admin import ExportMixin
from import_export.declarative import ModelDeclarativeMetaclass
from import_export.resources import ModelResource
from import_export.widgets import BooleanWidget, DateTimeWidget, DurationWidget, IntegerWidget, TimeWidget

from tilavarauspalvelu.models import ReservableTimeSpan, ReservationStatistic
from utils.utils import update_query_params

if TYPE_CHECKING:
    from collections.abc import Callable

    from import_export.fields import Field as ImportExportField

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
            detail = {"detail": str(error.message), "code": error.code or ""}
            return JsonResponse(detail, status=HTTPStatus.BAD_REQUEST)

        except PermissionDenied as error:
            detail = {"detail": str(error), "code": "permission_denied"}
            return JsonResponse(detail, status=HTTPStatus.UNAUTHORIZED)

    return wrapper


validate_url = URLValidator(schemes=(["https"] if not settings.DEBUG else ["https", "http"]))


def is_valid_url(url: str) -> bool:
    try:
        validate_url(url)
    except Exception:  # noqa: BLE001
        return False
    return True


def redirect_back_on_error[R, **P](func: Callable[P, R]) -> Callable[P, R]:
    """
    Error handler for endpoints that do redirects to other services.
    Cannot simply return an error response, since these endpoints will not be called with 'fetch' in the frontend.
    Instead, the endpoint should redirect back to the frontend with the error message and error code.
    Validates that frontend provides a 'redirect_on_error' parameter, and that it is a valid URL.
    """

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        redirect_on_error: str | None = None

        # If the first positional argument is the request object, try to get the 'redirect_on_error' parameter.
        request: Any = next(iter(args), None)
        if isinstance(request, HttpRequest):
            redirect_on_error = request.GET.get("redirect_on_error", None)

        # Try to use the 'Referrer' header, as it should be frontend's current URL.
        if redirect_on_error is None:
            redirect_on_error = request.META.get("HTTP_REFERER", None)

        if redirect_on_error is None:
            msg = "Request should include a 'redirect_on_error' parameter for error handling."
            return JsonResponse({"detail": msg, "code": "REDIRECT_ON_ERROR_MISSING"}, status=400)

        if not is_valid_url(redirect_on_error):
            msg = "The 'redirect_on_error' parameter should be a valid URL."
            return JsonResponse({"detail": msg, "code": "REDIRECT_ON_ERROR_INVALID"}, status=400)

        try:
            return func(*args, **kwargs)
        except ValidationError as error:
            redirect_on_error = update_query_params(
                redirect_on_error,
                error_message=str(error.message),
                error_code=str(error.code or ""),
            )
            return HttpResponseRedirect(redirect_to=redirect_on_error)

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
    reservations: list[uuid.UUID]
    tprek_id: str
    updated_after: datetime.datetime | None
    updated_before: datetime.datetime | None

    @classmethod
    def from_request(cls, request: WSGIRequest) -> StatisticsParams:
        reservations = parse_list_of_uuids(request, "only")
        begins_after = parse_datetime(request, "begins_after")
        begins_before = parse_datetime(request, "begins_before")
        tprek_id: str = str(request.GET.get("tprek_id", ""))
        updated_after = parse_datetime(request, "updated_after")
        updated_before = parse_datetime(request, "updated_before")

        return cls(
            begins_after=begins_after,
            begins_before=begins_before,
            reservations=reservations,
            tprek_id=tprek_id,
            updated_after=updated_after,
            updated_before=updated_before,
        )


@dataclasses.dataclass
class ReservableTimeSpansParams:
    reservation_units: list[int]
    tprek_id: str
    hauki_resource: list[int]
    after: datetime.datetime | None
    before: datetime.datetime | None

    @classmethod
    def from_request(cls, request: WSGIRequest) -> ReservableTimeSpansParams:
        reservation_units = parse_list_of_pks(request, "only")
        tprek_id = str(request.GET.get("tprek_id", ""))
        hauki_resource = parse_list_of_pks(request, "hauki_resource")
        after = parse_datetime(request, "after")
        before = parse_datetime(request, "before")

        return cls(
            reservation_units=reservation_units,
            tprek_id=tprek_id,
            hauki_resource=hauki_resource,
            after=after,
            before=before,
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


def parse_list_of_uuids(request: WSGIRequest, param: str) -> list[uuid.UUID]:
    try:
        return [uuid.UUID(pk) for pk in request.GET.get(param, "").split(",") if pk]
    except (ValueError, TypeError) as error:
        msg = f"'{param}' should be a comma separated list of UUIDs (v4)."
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


@cache
def create_statistics_exporter() -> ExportMixin:
    class ReservationStatisticResource(ModelResource, metaclass=ModelDeclarativeMetaclass):
        class Meta:
            model = ReservationStatistic
            exclude = ["id", "reservation"]

    fix_field_datetime_formats(ReservationStatisticResource)

    exporter = ExportMixin()
    exporter.model = ReservationStatistic
    exporter.resource_classes = [ReservationStatisticResource]
    return exporter


@cache
def create_reservable_time_spans_exporter() -> ExportMixin:
    class ReservableTimeSpanResource(ModelResource, metaclass=ModelDeclarativeMetaclass):
        class Meta:
            model = ReservableTimeSpan
            exclude = ["id"]

    fix_field_datetime_formats(ReservableTimeSpanResource)

    exporter = ExportMixin()
    exporter.model = ReservableTimeSpan
    exporter.resource_classes = [ReservableTimeSpanResource]
    return exporter


class MinutesDurationWidget(DurationWidget):
    def render(self, value: Any, **kwargs: Any) -> int | None:
        if value is None or type(value) is not datetime.timedelta:
            return None
        return int(value.total_seconds() / 60)


def fix_field_datetime_formats(resource: ModelDeclarativeMetaclass) -> None:
    field: ImportExportField
    for field in resource.fields.values():
        match field.widget:
            case DateTimeWidget():
                field.widget.formats = ["%Y-%m-%dT%H:%M:%S%:z"]
            case TimeWidget():
                field.widget.formats = ["%H:%M:%S%:z"]
            case DurationWidget():
                field.widget = MinutesDurationWidget()
            case IntegerWidget() | BooleanWidget():
                field.widget.coerce_to_string = False
