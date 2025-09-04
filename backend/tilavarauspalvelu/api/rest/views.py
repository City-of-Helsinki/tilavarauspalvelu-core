from __future__ import annotations

import datetime
import hmac
import io
import json
from http import HTTPStatus
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse

from django.apps import apps
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import connection, models
from django.http import FileResponse, HttpResponse, HttpResponseForbidden, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.views.csrf import csrf_failure
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from import_export.formats.base_formats import JSON
from rest_framework.exceptions import ValidationError as DRFValidationError

from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.opening_hours.hauki_link_generator import generate_hauki_link
from tilavarauspalvelu.management.commands.create_robot_test_data import create_robot_test_data
from tilavarauspalvelu.models import ReservableTimeSpan, Reservation, ReservationStatistic, ReservationUnit, TermsOfUse
from tilavarauspalvelu.services.export import ReservationUnitExporter
from tilavarauspalvelu.services.pdf import render_to_pdf
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.utils import comma_sep_str, ical_hmac_signature, update_query_params

from .utils import (
    ReservableTimeSpansParams,
    ReservationUnitParams,
    StatisticsParams,
    create_reservable_time_spans_exporter,
    create_statistics_exporter,
    is_valid_url,
    parse_list_of_pks,
    redirect_back_on_error,
    validate_pagination,
    validation_error_as_response,
)

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "csrf_view",
    "liveness_check",
    "readiness_check",
    "redirect_to_hauki",
    "redirect_to_verkkokauppa_for_pending_reservations",
    "reservable_time_spans_export",
    "reservation_ical",
    "reservation_statistics_export",
    "reservation_unit_export",
    "robot_test_data_create_view",
    "terms_of_use_pdf",
]


@require_GET
def reservation_ical(request: WSGIRequest, pk: int) -> FileResponse | JsonResponse:
    hash_pram = request.GET.get("hash", None)
    if hash_pram is None:
        return JsonResponse(data={"detail": "hash is required"}, status=400)

    # We use a prefix for the value to sign, because using the plain integer PK
    # could enable reusing the hashes for accessing other resources.
    comparison_signature = ical_hmac_signature(f"reservation-{pk}")
    if not hmac.compare_digest(comparison_signature, hash_pram):
        return JsonResponse(data={"detail": "invalid hash signature"}, status=400)

    try:
        reservation = Reservation.objects.get(pk=pk)
    except Reservation.DoesNotExist:
        return JsonResponse(data={"detail": "reservation not found"}, status=404)

    try:
        ical = reservation.actions.to_ical()
    except Exception as exc:  # noqa: BLE001
        return JsonResponse(data={"detail": str(exc)}, status=500)

    buffer = io.BytesIO()
    buffer.write(ical)
    buffer.seek(0)

    return FileResponse(buffer, as_attachment=True, filename="reservation_calendar.ics")


@require_GET
@csrf_exempt  # NOSONAR
def csrf_view(request: WSGIRequest) -> HttpResponseRedirect | JsonResponse:  # NOSONAR
    """View for updating the CSRF cookie."""
    # From: https://fractalideas.com/blog/making-react-and-django-play-well-together-single-page-app-model/
    # > You may wonder whether this endpoint creates a security vulnerability.
    # > From a security perspective, it's no different from any page that contains
    # > the CSRF token on a traditional Django website. The browser's same-origin policy
    # > prevents an attacker from getting access to the token with a cross-origin request.
    # Additionally, our backend's CORS policy only allows cross-origin requests from the frontend.
    redirect_to: str | None = request.GET.get("redirect_to", None)  # NOSONAR
    # Set these META-flags to force `django.middleware.csrf.CsrfViewMiddleware` to update the CSRF cookie.
    request.META["CSRF_COOKIE_NEEDS_UPDATE"] = True
    request.META["CSRF_COOKIE"] = get_token(request)
    # Add the new CSRF token to the response headers also, so that the frontend can update
    # the CSRF token during local development. This is because frontend is running in a different port
    # during local development, which is considered a different origin, and thus the CSRF cookie is not
    # shared automatically like it is in production.
    headers = {"NewCSRFToken": request.META["CSRF_COOKIE"]}
    if redirect_to is None:
        return JsonResponse(data={"csrfToken": request.META["CSRF_COOKIE"]}, status=200, headers=headers)
    return HttpResponseRedirect(redirect_to=redirect_to, headers=headers)  # NOSONAR


@csrf_exempt  # NOSONAR
def csrf_failure_view(request: WSGIRequest, **kwargs: Any) -> JsonResponse | HttpResponseForbidden:
    if not any(media_type.match("application/json") for media_type in request.accepted_types):
        return csrf_failure(request, **kwargs)

    # Called by CSRF middleware since set in 'CSRF_FAILURE_VIEW' setting.
    data = {
        "error": "CSRF verification failed. Request aborted.",
        "code": "CSRF_FAILURE",
        "reason": kwargs.get("reason", "unknown"),
    }

    return JsonResponse(data=data, status=HTTPStatus.FORBIDDEN)


@require_GET
@csrf_exempt  # NOSONAR
def terms_of_use_pdf(request: WSGIRequest) -> FileResponse | JsonResponse:
    """Download the booking terms of use as a PDF"""
    title = "Tilavarauspalvelu yleiset sopimusehdot"
    as_attachment = request.GET.get("as_attachment", "1").lower() not in {"0", "false", "no", "n"}

    try:
        terms = TermsOfUse.objects.get(id="booking")
    except TermsOfUse.DoesNotExist:
        data = {"detail": "Terms of use with ID 'booking' not found"}
        return JsonResponse(data=data, status=404)

    context = {
        "title": title,
        "terms_name_fi": terms.name_fi,
        "terms_name_en": terms.name_en,
        "terms_name_sv": terms.name_sv,
        "terms_text_fi": terms.text_fi,
        "terms_text_en": terms.text_en,
        "terms_text_sv": terms.text_sv,
    }

    try:
        pdf = render_to_pdf("terms_of_use/booking_terms.jinja", **context)
    except Exception as error:  # noqa: BLE001
        data = {"detail": f"PDF could not be rendered: {error}"}
        return JsonResponse(data=data, status=500)

    buffer = io.BytesIO()
    buffer.write(pdf)
    buffer.seek(0)

    return FileResponse(
        buffer,
        as_attachment=as_attachment,
        filename=f"{title.replace(' ', '_')}.pdf",
    )


@require_GET
@csrf_exempt  # NOSONAR
def liveness_check(request: WSGIRequest) -> JsonResponse:
    return JsonResponse({"status": "RUNNING"}, status=200)


@require_GET
@csrf_exempt  # NOSONAR
def readiness_check(request: WSGIRequest) -> JsonResponse:
    try:
        connection.ensure_connection()
        apps.check_apps_ready()
        apps.check_models_ready()
    except Exception as error:  # noqa: BLE001
        return JsonResponse({"status": "NOT_READY", "error": str(error)}, status=503)

    return JsonResponse({"status": "READY"}, status=200)


@require_GET
@csrf_exempt  # NOSONAR
@validation_error_as_response
def reservation_unit_export(request: WSGIRequest) -> HttpResponse:
    """Export reservation units to JSON."""
    # --- Authorization ----------------------------------------------------------------------------------------------

    authorization = request.META.get("HTTP_AUTHORIZATION", "")
    if authorization != settings.EXPORT_AUTHORIZATION_TOKEN:
        msg = "Not authorized to export reservation units."
        return HttpResponseForbidden(msg)

    # --- Parsing ----------------------------------------------------------------------------------------------------

    params = ReservationUnitParams.from_request(request)

    # --- Pagination -------------------------------------------------------------------------------------------------

    start, stop = validate_pagination(request)

    # --- Filtering --------------------------------------------------------------------------------------------------

    queryset = ReservationUnit.objects.order_by("id")

    if params.reservation_units:
        queryset = queryset.filter(pk__in=params.reservation_units)
    if params.tprek_id:
        queryset = queryset.filter(unit__tprek_id=params.tprek_id)
    if params.updated_after:
        queryset = queryset.filter(updated_at__gte=params.updated_after)
    if params.updated_before:
        queryset = queryset.filter(updated_at__lt=params.updated_before)

    total_count = queryset.count()
    queryset = queryset[start:stop]

    # --- Export -----------------------------------------------------------------------------------------------------

    exporter = ReservationUnitExporter(queryset=queryset, datetime_format="ISO")
    data = exporter.write_json()

    # --- Response ---------------------------------------------------------------------------------------------------

    headers: dict[str, str] = {
        "Varaamo-Pagination-Total-Count": str(total_count),
        "Varaamo-Pagination-Start": str(queryset.query.low_mark),
        "Varaamo-Pagination-Stop": str(queryset.query.high_mark),
    }

    return JsonResponse(
        data,
        safe=False,
        status=200,
        headers=headers,
        json_dumps_params={"sort_keys": True},
    )


@require_GET
@csrf_exempt  # NOSONAR
@validation_error_as_response
def reservation_statistics_export(request: WSGIRequest) -> HttpResponse:
    """Export reservation statistics to JSON."""
    # --- Authorization ----------------------------------------------------------------------------------------------

    authorization = request.META.get("HTTP_AUTHORIZATION", "")
    if authorization != settings.EXPORT_AUTHORIZATION_TOKEN:
        msg = "Not authorized to export reservation statistics."
        return HttpResponseForbidden(msg)

    # --- Parsing ----------------------------------------------------------------------------------------------------

    params = StatisticsParams.from_request(request)

    # --- Pagination -------------------------------------------------------------------------------------------------

    start, stop = validate_pagination(request)

    # --- Filtering --------------------------------------------------------------------------------------------------

    queryset = ReservationStatistic.objects.order_by("id")

    if params.reservations:
        queryset = queryset.filter(reservation__ext_uuid__in=params.reservations)
    if params.tprek_id:
        queryset = queryset.filter(reservation__reservation_unit__unit__tprek_id=params.tprek_id)
    if params.begins_after:
        queryset = queryset.filter(begin__gte=params.begins_after)
    if params.begins_before:
        queryset = queryset.filter(begin__lt=params.begins_before)
    if params.updated_after:
        queryset = queryset.filter(updated_at__gte=params.updated_after)
    if params.updated_before:
        queryset = queryset.filter(updated_at__lt=params.updated_before)

    total_count = queryset.count()
    queryset = queryset[start:stop]

    # --- Export -----------------------------------------------------------------------------------------------------

    exporter = create_statistics_exporter()
    data_for_export = exporter.get_data_for_export(request, queryset)
    export_data: str = JSON().export_data(data_for_export)

    # --- Response ---------------------------------------------------------------------------------------------------

    headers: dict[str, str] = {
        "Varaamo-Pagination-Total-Count": str(total_count),
        "Varaamo-Pagination-Start": str(queryset.query.low_mark),
        "Varaamo-Pagination-Stop": str(queryset.query.high_mark),
    }

    return JsonResponse(
        json.loads(export_data),
        safe=False,
        status=200,
        headers=headers,
        json_dumps_params={"sort_keys": True},
    )


@require_GET
@csrf_exempt  # NOSONAR
@validation_error_as_response
def reservable_time_spans_export(request: WSGIRequest) -> HttpResponse:
    """Export reservable time spans to JSON."""
    # --- Authorization ----------------------------------------------------------------------------------------------

    authorization = request.META.get("HTTP_AUTHORIZATION", "")
    if authorization != settings.EXPORT_AUTHORIZATION_TOKEN:
        msg = "Not authorized to export reservable time spans."
        return HttpResponseForbidden(msg)

    # --- Parsing ----------------------------------------------------------------------------------------------------

    params = ReservableTimeSpansParams.from_request(request)

    # --- Pagination -------------------------------------------------------------------------------------------------

    start, stop = validate_pagination(request)

    # --- Filtering --------------------------------------------------------------------------------------------------

    queryset = ReservableTimeSpan.objects.all()

    if params.reservation_units:
        queryset = queryset.filter(resource__reservation_units__in=params.reservation_units).distinct()
    if params.tprek_id:
        queryset = queryset.filter(resource__reservation_units__unit__tprek_id=params.tprek_id).distinct()
    if params.hauki_resource:
        queryset = queryset.filter(resource__in=params.hauki_resource)
    if params.after:
        queryset = queryset.filter(end_datetime__gt=params.after)
    if params.before:
        queryset = queryset.filter(start_datetime__lte=params.before)

    total_count = queryset.count()
    queryset = queryset[start:stop]

    # --- Export -----------------------------------------------------------------------------------------------------

    exporter = create_reservable_time_spans_exporter()
    data_for_export = exporter.get_data_for_export(request, queryset)
    export_data: str = JSON().export_data(data_for_export)

    # --- Response ---------------------------------------------------------------------------------------------------

    headers: dict[str, str] = {
        "Varaamo-Pagination-Total-Count": str(total_count),
        "Varaamo-Pagination-Start": str(queryset.query.low_mark),
        "Varaamo-Pagination-Stop": str(queryset.query.high_mark),
    }

    return JsonResponse(
        json.loads(export_data),
        safe=False,
        status=200,
        headers=headers,
        json_dumps_params={"sort_keys": True},
    )


def append_payment_method_to_checkout_url(checkout_url: str, request: WSGIRequest) -> str:
    # Append "/paymentmethod" to the checkout URL path to skip entering customer information in the checkout process.
    parsed_url = urlparse(checkout_url)
    parsed_url = parsed_url._replace(path=f"{parsed_url.path.removesuffix('/')}/paymentmethod").geturl()

    # Update the query parameters to include the language from the request, keep existing query params as-is.
    if (request_lang := request.GET.get("lang")) is not None:
        return update_query_params(url=parsed_url, lang=request_lang)

    return parsed_url


@require_GET
@redirect_back_on_error
def redirect_to_verkkokauppa_for_pending_reservations(request: WSGIRequest, pk: int) -> HttpResponseRedirect:
    """Redirect user to verkkokauppa for paying pending reservations."""
    reservation: Reservation | None = Reservation.objects.filter(pk=pk).first()
    if reservation is None:
        msg = "Reservation not found"
        raise ValidationError(msg, code="RESERVATION_NOT_FOUND")

    if reservation.user != request.user:
        msg = "Reservation is not owned by the requesting user"
        raise ValidationError(msg, code="RESERVATION_NOT_OWNED_BY_USER")

    if reservation.state != ReservationStateChoice.CONFIRMED:
        msg = "Reservation is not confirmed"
        raise ValidationError(msg, code="RESERVATION_NOT_CONFIRMED")

    if not hasattr(reservation, "payment_order"):
        msg = "Reservation does not have a payment order"
        raise ValidationError(msg, code="RESERVATION_NO_PAYMENT_ORDER")

    payment_order = reservation.payment_order

    if payment_order.payment_type not in PaymentType.requires_verkkokauppa:
        msg = "Reservation does not require verkkokauppa payment"
        raise ValidationError(msg, code="RESERVATION_NO_VERKKOKAUPPA_PAYMENT")

    if payment_order.status != OrderStatus.PENDING:
        msg = "Payment for reservation is not in status 'PENDING'"
        raise ValidationError(msg, code="RESERVATION_PAYMENT_ORDER_NOT_PENDING")

    due_by = payment_order.handled_payment_due_by.astimezone(DEFAULT_TIMEZONE)
    leeway = datetime.timedelta(seconds=3)
    cutoff = local_datetime() - leeway

    if due_by <= cutoff:
        msg = "Reservation can no longer be paid since its due by date has passed"
        raise ValidationError(msg, code="RESERVATION_PAYMENT_ORDER_PAST_DUE_BY")

    # Could already have a verkkokauppa order from previous checkout attempt.
    if is_valid_url(payment_order.checkout_url) and payment_order.expires_at > cutoff:
        return HttpResponseRedirect(append_payment_method_to_checkout_url(payment_order.checkout_url, request))

    begin_date = reservation.begins_at.astimezone(DEFAULT_TIMEZONE).date()
    reservation_unit: ReservationUnit = reservation.reservation_unit
    pricing = reservation_unit.actions.get_active_pricing(by_date=begin_date)

    if pricing is None:
        msg = "Reservation unit has no active pricing information"
        raise ValidationError(msg, code="RESERVATION_UNIT_NO_ACTIVE_PRICING")

    # If creating a new payment order, tax percentage should be updated from the latest pricing
    reservation.tax_percentage_value = pricing.tax_percentage.value
    reservation.save(update_fields=["tax_percentage_value"])

    try:
        verkkokauppa_order = reservation.actions.create_order_in_verkkokauppa()
    except DRFValidationError as error:
        msg = "Payment for reservation could not be created in verkkokauppa"
        raise ValidationError(msg, code="RESERVATION_PAYMENT_CREATION_FAILED") from error

    payment_order.remote_id = verkkokauppa_order.order_id
    payment_order.checkout_url = verkkokauppa_order.checkout_url
    payment_order.receipt_url = verkkokauppa_order.receipt_url
    payment_order.created_at = local_datetime()
    payment_order.save(update_fields=["remote_id", "checkout_url", "receipt_url", "created_at"])

    return HttpResponseRedirect(append_payment_method_to_checkout_url(payment_order.checkout_url, request))


@require_GET
@redirect_back_on_error
def redirect_to_hauki(request: WSGIRequest) -> HttpResponseRedirect:
    if not request.user.is_authenticated:
        msg = "User must be authenticated to use Hauki"
        raise ValidationError(msg, code="HAUKI_USER_NOT_AUTHENTICATED")

    user: User = request.user
    if not user.email:
        msg = "User does not have email address"
        raise ValidationError(msg, code="HAUKI_USER_NO_EMAIL")

    given_pks = parse_list_of_pks(request, "reservation_units")
    if not given_pks:
        msg = "No reservation units provided"
        raise ValidationError(msg, code="HAUKI_MISSING_RESERVATION_UNITS")

    reservation_units: list[ReservationUnit] = list(
        ReservationUnit.objects.all()
        .filter(pk__in=given_pks)
        .select_related(
            "origin_hauki_resource",
            "unit",
        )
        .prefetch_related(
            "unit__unit_groups",
        )
        .alias(
            # Return reservation units in the same order as the pks were given.
            given_ordering=models.Case(
                *(models.When(pk=pk, then=models.Value(index)) for index, pk in enumerate(given_pks)),
                default=models.Value(len(given_pks)),
                output_field=models.IntegerField(),
            )
        )
        .order_by(models.F("given_ordering"))
    )

    existing_pks = {reservation_unit.pk for reservation_unit in reservation_units}
    missing_pks = set(given_pks) - existing_pks

    if missing_pks:
        msg = f"Some of the reservation units could not be found: {comma_sep_str(sorted(missing_pks))}"
        raise ValidationError(msg, code="HAUKI_INVALID_RESERVATION_UNITS")

    # At this point we should have at least one reservation unit.
    # Always use the first one given by frontend as the primary reservation unit.
    primary = reservation_units[0]

    if primary.unit.tprek_department_id is None:
        msg = f"Primary reservation unit '{primary.ext_uuid}' department ID is missing"
        raise ValidationError(msg, code="HAUKI_DEPARTMENT_ID_MISSING")

    target_resources: list[uuid.UUID] = []

    # Don't include the primary reservation unit in the target resources.
    for reservation_unit in reservation_units[1:]:
        if reservation_unit.origin_hauki_resource is None:
            msg = f"Reservation unit '{reservation_unit.ext_uuid}' is not linked to a Hauki resource"
            raise ValidationError(msg, code="HAUKI_RESOURCE_NOT_LINKED")

        if not user.permissions.can_manage_unit(reservation_unit.unit):
            msg = f"User does not have permission to manage reservation unit '{reservation_unit.ext_uuid}'"
            raise ValidationError(msg, code="HAUKI_PERMISSIONS_DENIED")

        target_resources.append(reservation_unit.ext_uuid)

    hauki_url = generate_hauki_link(
        reservation_unit_uuid=primary.ext_uuid,
        user_email=user.email,
        organization_id=primary.unit.hauki_department_id,
        target_resources=target_resources or None,
    )
    if hauki_url is None:
        msg = "Could not generate Hauki link"
        raise ValidationError(msg, code="HAUKI_URL_GENERATION_FAILED")

    return HttpResponseRedirect(hauki_url)


@require_POST
@csrf_exempt  # NOSONAR
@validation_error_as_response
def robot_test_data_create_view(request: WSGIRequest) -> HttpResponse:
    token = request.META.get("HTTP_AUTHORIZATION")
    if token is None:
        msg = "Missing authorization header"
        raise PermissionDenied(msg)

    if token != settings.ROBOT_TEST_DATA_TOKEN:
        msg = "Invalid authorization header"
        raise PermissionDenied(msg)

    rate_limit_key = settings.ROBOT_TEST_DATA_RATE_LIMIT_KEY

    now = int(local_datetime().timestamp())
    last_called_at = int(cache.get(key=rate_limit_key, default=0))

    time_left = settings.ROBOT_TEST_DATA_CREATION_RATE_LIMIT_SECONDS - (now - last_called_at)

    if time_left > 0:
        detail = {"detail": "Robot test data creation is rate limited", "code": "too_many_requests"}
        return JsonResponse(detail, status=HTTPStatus.TOO_MANY_REQUESTS, headers={"Retry-After": time_left})

    cache.set(key=rate_limit_key, value=now, timeout=None)

    lock_key = settings.ROBOT_TEST_DATA_LOCK_KEY

    lock = bool(cache.get(key=lock_key))
    if lock:
        detail = {"detail": "Robot test data creation is already in progress", "code": "too_early"}
        return JsonResponse(detail, status=HTTPStatus.TOO_EARLY)

    try:
        cache.set(key=lock_key, value=True, timeout=None)

        try:
            create_robot_test_data()

        except ValidationError:
            raise

        except Exception as error:
            msg = f"Failed to create robot test data: {error}"
            raise ValidationError(msg, code="failed_to_create_robot_test_data") from error

    finally:
        cache.delete(lock_key)

    return HttpResponse(status=204)
