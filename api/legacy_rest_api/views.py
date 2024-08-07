import hmac
import io
from typing import Any

from django.http import FileResponse
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.viewsets import ViewSet

from reservations.models import Reservation

from .utils import export_reservation_events, get_host, hmac_signature, reservation_unit_calendar

__all__ = [
    "ReservationIcalViewset",
]


class ReservationIcalViewset(ViewSet):
    # Used by ReservationNode.resolve_calendar_url!

    queryset = Reservation.objects.all()

    def get_object(self):
        return Reservation.objects.filter(pk=self.kwargs["pk"]).prefetch_related("reservation_unit").first()

    def retrieve(self, request: Request, *args: Any, **kwargs: Any) -> FileResponse:
        hash_pram = request.query_params.get("hash", None)
        if hash_pram is None:
            raise ValidationError("hash is required")

        instance = self.get_object()
        # We use a prefix for the value to sign, because using the plain integer PK
        # could enable reusing the hashes for accessing other resources.
        comparison_signature = hmac_signature(f"reservation-{instance.pk}")

        if not hmac.compare_digest(comparison_signature, hash_pram):
            raise ValidationError("invalid hash signature")

        buffer = io.BytesIO()
        buffer.write(
            export_reservation_events(
                instance,
                get_host(request),
                reservation_unit_calendar(instance.reservation_unit),
            ).to_ical()
        )
        buffer.seek(0)

        return FileResponse(buffer, as_attachment=True, filename="reservation_calendar.ics")
