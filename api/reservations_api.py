from rest_framework import viewsets, serializers
from reservations.models import Reservation
from reservation_units.models import ReservationUnit
from .reservation_units_api import ReservationUnitSerializer
from drf_extra_fields.relations import PresentablePrimaryKeyRelatedField


class ReservationSerializer(serializers.ModelSerializer):
    reservation_unit = PresentablePrimaryKeyRelatedField(
        presentation_serializer=ReservationUnitSerializer,
        many=True,
        queryset=ReservationUnit.objects.all(),
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

    def validate(self, data):
        for reservation_unit in data["reservation_unit"]:
            if reservation_unit.check_reservation_overlap(data["begin"], data["end"]):
                raise serializers.ValidationError(
                    "Overlapping reservations are not allowed"
                )
        return data


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer
    queryset = (
        Reservation.objects.all()
        .prefetch_related("reservation_unit")
        .select_related("recurring_reservation")
    )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
