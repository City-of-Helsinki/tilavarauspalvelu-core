from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django_filters import rest_framework as filters
from drf_extra_fields.relations import PresentablePrimaryKeyRelatedField
from drf_spectacular.utils import extend_schema
from rest_framework import filters as drf_filters
from rest_framework import permissions, serializers, viewsets

from permissions.api_permissions import (
    AbilityGroupPermission,
    AgeGroupPermission,
    ReservationPermission,
)
from permissions.helpers import (
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservation_units.models import ReservationUnit
from reservations.models import STATE_CHOICES, AbilityGroup, AgeGroup, Reservation

from .reservation_units_api import ReservationUnitSerializer

User = get_user_model()


class ReservationSerializer(serializers.ModelSerializer):
    reservation_unit = PresentablePrimaryKeyRelatedField(
        presentation_serializer=ReservationUnitSerializer,
        many=True,
        queryset=ReservationUnit.objects.all(),
        help_text="Reservation units that are reserved by the reservation",
    )
    user_id = serializers.PrimaryKeyRelatedField(
        read_only=True,
        source="user",
        help_text="Id of user for this reservation.",
    )

    class Meta:
        model = Reservation
        fields = [
            "id",
            "state",
            "priority",
            "user_id",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_unit",
            "recurring_reservation",
        ]
        extra_kwargs = {
            "state": {
                "help_text": "State of the reservation. Default is 'created'.",
            },
            "priority": {
                "help_text": "Priority of this reservation. Higher priority reservations replaces lower ones.",
            },
            "buffer_time_before": {
                "help_text": "Buffer time while reservation unit is unreservable before the reservation. "
                "Dynamically calculated from spaces and resources.",
            },
            "buffer_time_after": {
                "help_text": "Buffer time while reservation unit is unreservable after the reservation. "
                "Dynamically calculated from spaces and resources.",
            },
            "begin": {
                "help_text": "Begin date and time of the reservation.",
            },
            "end": {
                "help_text": "End date and time of the reservation.",
            },
            "recurring_reservation": {
                "help_text": "Id relation to recurring reservation object if the reservation is part of recurrence.",
            },
        }

    def validate(self, data):
        for reservation_unit in data["reservation_unit"]:
            if reservation_unit.check_reservation_overlap(
                data["begin"], data["end"], self.instance
            ):
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
    active = filters.BooleanFilter(
        method="is_active", help_text="Show only confirmed and active reservations."
    )

    reservation_unit = filters.ModelMultipleChoiceFilter(
        field_name="reservation_unit",
        queryset=ReservationUnit.objects.all(),
        help_text="Show only reservations to certain reservation units.",
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
    permission_classes = (
        [ReservationPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )

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
        serializer.save(user_id=self.request.user.pk)

    def get_queryset(self):
        queryset = super().get_queryset()
        if settings.TMP_PERMISSIONS_DISABLED:
            return queryset
        user = self.request.user
        return queryset.filter(
            Q(reservation_unit__unit__in=get_units_where_can_view_reservations(user))
            | Q(
                reservation_unit__unit__service_sectors__in=get_service_sectors_where_can_view_reservations(
                    user
                )
            )
            | Q(user=user)
        )


class AgeGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgeGroup
        fields = [
            "id",
            "minimum",
            "maximum",
        ]
        extra_kwargs = {
            "minimum": {
                "help_text": "Minimum age of persons included in the age group.",
            },
            "maximum": {
                "help_text": "Maximum age of persons included in the age group.",
            },
        }

    def __init__(self, *args, display=False, **kwargs):
        super(AgeGroupSerializer, self).__init__(*args, **kwargs)
        if display:
            self.fields.pop("id")

    def validate(self, data):
        min_age = data["minimum"]
        max_age = data["maximum"]

        if max_age is not None and max_age <= min_age:
            raise serializers.ValidationError(
                "Maximum age should be larger than minimum age"
            )
        return data


@extend_schema(description="Age group of attendees for application events.")
class AgeGroupViewSet(viewsets.ModelViewSet):
    serializer_class = AgeGroupSerializer
    queryset = AgeGroup.objects.all()
    permission_classes = (
        [AgeGroupPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )


class AbilityGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbilityGroup
        fields = [
            "id",
            "name",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the ability group.",
            },
        }


@extend_schema(description="Ability group of attendees for application events.")
class AbilityGroupViewSet(viewsets.ModelViewSet):
    serializer_class = AbilityGroupSerializer
    queryset = AbilityGroup.objects.all()
    permission_classes = (
        [AbilityGroupPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
