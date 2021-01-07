from django_filters import rest_framework as filters
from drf_extra_fields.relations import PresentablePrimaryKeyRelatedField
from rest_framework import filters as drf_filters
from rest_framework import serializers, viewsets

from reservation_units.models import ReservationUnit
from reservations.models import STATE_CHOICES, AbilityGroup, AgeGroup, Reservation

from .reservation_units_api import ReservationUnitSerializer


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


class ReservationFilter(filters.FilterSet):
    state = filters.MultipleChoiceFilter(
        field_name="state",
        choices=STATE_CHOICES.STATE_CHOICES,
    )

    # Effectively active or inactive only reservations
    active = filters.BooleanFilter(method="is_active")

    reservation_unit = filters.ModelMultipleChoiceFilter(
        field_name="reservation_unit", queryset=ReservationUnit.objects.all()
    )

    def is_active(self, queryset, value, *args, **kwargs):
        active_only = bool(args[0])
        if active_only:
            return queryset.filter(state="confirmed")
        return queryset.exclude(state="confirmed")

    class Meta:
        model = Reservation
        fields = ["state"]


class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationSerializer

    filter_backends = [
        drf_filters.OrderingFilter,
        filters.DjangoFilterBackend,
        drf_filters.SearchFilter,
    ]

    filterset_class = ReservationFilter
    queryset = (
        Reservation.objects.all()
        .prefetch_related("reservation_unit")
        .select_related("recurring_reservation")
    )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AgeGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgeGroup
        fields = [
            "id",
            "minimum",
            "maximum",
        ]

    def validate(self, data):
        min_age = data["minimum"]
        max_age = data["maximum"]

        if max_age is not None and max_age <= min_age:
            raise serializers.ValidationError(
                "Maximum age should be larger than minimum age"
            )
        return data


class AgeGroupViewSet(viewsets.ModelViewSet):
    serializer_class = AgeGroupSerializer
    queryset = AgeGroup.objects.all()


class AbilityGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbilityGroup
        fields = [
            "id",
            "name",
        ]


class AbilityGroupViewSet(viewsets.ModelViewSet):
    serializer_class = AbilityGroupSerializer
    queryset = AbilityGroup.objects.all()
