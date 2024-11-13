from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET

from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.typing import WSGIRequest


@require_GET
@csrf_exempt  # NOSONAR
def palvelukartta_reservation_units(request: WSGIRequest, tprek_id: str) -> JsonResponse:
    reservation_units = list(
        ReservationUnit.objects.filter(unit__tprek_id=tprek_id)
        .visible()
        .order_by("pk")
        .values("pk", "name_fi", "name_en", "name_sv")
    )
    return JsonResponse(reservation_units, status=200, safe=False)
