from __future__ import annotations

import hmac
import io
from typing import TYPE_CHECKING

from django.apps import apps
from django.db import connection
from django.http import FileResponse, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from tilavarauspalvelu.models import Reservation, TermsOfUse
from tilavarauspalvelu.utils.pdf import render_to_pdf
from utils.utils import ical_hmac_signature

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "csrf_view",
    "liveness_check",
    "readiness_check",
    "reservation_ical",
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
    except Exception as exc:
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
    redirect_to: str | None = request.GET.get("redirect_to", None)
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
    return HttpResponseRedirect(redirect_to=redirect_to, headers=headers)


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
    except Exception as error:
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
    except Exception as error:
        return JsonResponse({"status": "NOT_READY", "error": str(error)}, status=503)

    return JsonResponse({"status": "READY"}, status=200)
