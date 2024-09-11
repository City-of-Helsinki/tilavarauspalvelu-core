import hmac
import io

from django.core.handlers.wsgi import WSGIRequest
from django.http import FileResponse, HttpResponseRedirect, JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET

from common.utils import ical_hmac_signature
from reservations.models import Reservation

__all__ = [
    "reservation_ical",
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
        ical = reservation.actions.to_ical(site_name=request.get_host())
    except Exception as exc:
        return JsonResponse(data={"detail": str(exc)}, status=500)

    buffer = io.BytesIO()
    buffer.write(ical)
    buffer.seek(0)

    return FileResponse(buffer, as_attachment=True, filename="reservation_calendar.ics")


@require_GET
def csrf_view(request: WSGIRequest) -> HttpResponseRedirect:  # NOSONAR
    """View for updating the CSRF cookie."""
    # From: https://fractalideas.com/blog/making-react-and-django-play-well-together-single-page-app-model/
    # > You may wonder whether this endpoint creates a security vulnerability.
    # > From a security perspective, it's no different from any page that contains
    # > the CSRF token on a traditional Django website. The browser's same-origin policy
    # > prevents an attacker from getting access to the token with a cross-origin request.
    # Additionally, our backend's CORS policy only allows cross-origin requests from the frontend.
    redirect_to: str = request.GET.get("redirect_to", "/")
    # Set these META-flags to force `django.middleware.csrf.CsrfViewMiddleware` to update the CSRF cookie.
    request.META["CSRF_COOKIE_NEEDS_UPDATE"] = True
    request.META["CSRF_COOKIE"] = get_token(request)
    # Add the new CSRF token to the response headers also, so that the frontend can update
    # the CSRF token during local development. This is because frontend is running in a different port
    # during local development, which is considered a different origin, and thus the CSRF cookie is not
    # shared automatically like it is in production.
    headers = {"NewCSRFToken": request.META["CSRF_COOKIE"]}
    return HttpResponseRedirect(redirect_to=redirect_to, headers=headers)
