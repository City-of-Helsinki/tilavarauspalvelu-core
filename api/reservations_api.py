from rest_framework import viewsets
from api.base import BaseNestedSerializer
from reservations.models import Reservation
from .reservation_units_api import ReservationUnitSerializer


class ReservationSerializer(BaseNestedSerializer):
    reservation_unit = ReservationUnitSerializer(
        read_only=True, many=True, exclude_detail_fields=True
    )

    class Meta:
        model = Reservation
        fields = [
            "id",
            "state",
            "priority",
            "user",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_unit",
            "recurring_reservation",
        ]


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    queryset = (
        Reservation.objects.all()
        .prefetch_related("reservation_unit")
        .select_related("recurring_reservation")
    )
