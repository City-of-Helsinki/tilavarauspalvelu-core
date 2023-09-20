from django.contrib.auth import get_user_model
from django.db.models import Prefetch, Q
from django.utils.timezone import localtime
from django_filters import rest_framework as filters
from drf_extra_fields.relations import PresentablePrimaryKeyRelatedField
from drf_spectacular.utils import extend_schema
from rest_framework import filters as drf_filters
from rest_framework import serializers, viewsets

from api.common_filters import ModelInFilter
from api.reservation_units_api import ReservationUnitSerializer
from applications.models import Application, ApplicationEvent
from permissions.api_permissions.drf_permissions import (
    AbilityGroupPermission,
    AgeGroupPermission,
    RecurringReservationPermission,
    ReservationPermission,
)
from permissions.helpers import (
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservation_units.models import Equipment, ReservationUnit
from reservations.models import (
    STATE_CHOICES,
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
)
from resources.models import Resource
from spaces.models import Space

User = get_user_model()


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
        super().__init__(*args, **kwargs)
        if display:
            self.fields.pop("id")

    def validate(self, data):
        min_age = data["minimum"]
        max_age = data["maximum"]

        if max_age is not None and max_age <= min_age:
            raise serializers.ValidationError("Maximum age should be larger than minimum age")
        return data


@extend_schema(description="Age group of attendees for application events.")
class AgeGroupViewSet(viewsets.ModelViewSet):
    serializer_class = AgeGroupSerializer
    queryset = AgeGroup.objects.all()
    permission_classes = [AgeGroupPermission]


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
    permission_classes = [AbilityGroupPermission]


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
    begin_weekday = serializers.SerializerMethodField()
    application_event_name = serializers.SerializerMethodField()
    reservation_user = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "state",
            "priority",
            "user_id",
            "begin_weekday",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "application_event_name",
            "reservation_user",
            "reservation_unit",
            "recurring_reservation",
            "type",
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

    def get_begin_weekday(self, instance):
        return instance.begin.weekday()

    def get_application_event_name(self, instance):
        if instance.recurring_reservation:
            return instance.recurring_reservation.application_event.name
        return None

    def get_reservation_user(self, instance):
        if not instance.recurring_reservation:
            return None

        if instance.recurring_reservation.application.organisation:
            return instance.recurring_reservation.application.organisation.name

        return instance.user.get_full_name()

    def validate(self, data):
        for reservation_unit in data["reservation_unit"]:
            if reservation_unit.check_reservation_overlap(data["begin"], data["end"], self.instance):
                raise serializers.ValidationError("Overlapping reservations are not allowed")
        return data


class ReservationFilter(filters.FilterSet):
    state = filters.MultipleChoiceFilter(
        field_name="state",
        choices=STATE_CHOICES.STATE_CHOICES,
    )

    # Effectively active or inactive only reservations
    active = filters.BooleanFilter(method="is_active", help_text="Show only confirmed and active reservations.")

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
    permission_classes = [ReservationPermission]

    filter_backends = [
        drf_filters.OrderingFilter,
        filters.DjangoFilterBackend,
        drf_filters.SearchFilter,
    ]

    filterset_class = ReservationFilter
    queryset = (
        Reservation.objects.all()
        .select_related(
            "user",
            "recurring_reservation",
            "recurring_reservation__application",
            "recurring_reservation__application__organisation",
            "recurring_reservation__application_event",
        )
        .prefetch_related(
            Prefetch(
                "reservation_unit",
                queryset=(
                    ReservationUnit.objects.all()
                    .select_related("reservation_unit_type", "unit")
                    .prefetch_related(
                        "services",
                        "images",
                        "unit",
                        Prefetch("equipments", queryset=Equipment.objects.all().only("id")),
                        Prefetch(
                            "spaces",
                            queryset=Space.objects.all().select_related("building", "location"),
                        ),
                        Prefetch(
                            "resources",
                            queryset=Resource.objects.all().select_related("space"),
                        ),
                    )
                ),
            )
        )
    )

    def perform_create(self, serializer):
        serializer.save(user_id=self.request.user.pk)

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user
        return queryset.filter(
            Q(reservation_unit__unit__in=get_units_where_can_view_reservations(user))
            | Q(reservation_unit__unit__service_sectors__in=get_service_sectors_where_can_view_reservations(user))
            | Q(user=user)
        ).order_by("begin")


class RecurringReservationSerializer(serializers.ModelSerializer):
    reservations = PresentablePrimaryKeyRelatedField(
        presentation_serializer=ReservationSerializer,
        many=True,
        queryset=Reservation.objects.all(),
        help_text="This recurring reservation's reservations.",
    )
    first_reservation_begin = serializers.SerializerMethodField()
    last_reservation_end = serializers.SerializerMethodField()
    begin_weekday = serializers.SerializerMethodField()
    age_group = PresentablePrimaryKeyRelatedField(
        presentation_serializer=AgeGroupSerializer,
        queryset=AgeGroup.objects.all(),
    )
    purpose_name = serializers.SerializerMethodField()
    group_size = serializers.SerializerMethodField()
    denied_reservations = ReservationSerializer(many=True, read_only=True)
    biweekly = serializers.BooleanField(source="application_event.biweekly", read_only=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "id",
            "application_id",
            "application_event_id",
            "age_group",
            "purpose_name",
            "group_size",
            "ability_group_id",
            "begin_weekday",
            "first_reservation_begin",
            "last_reservation_end",
            "biweekly",
            "reservations",
            "denied_reservations",
        ]
        extra_kwargs = {
            "application": {
                "help_text": "Application of the recurring reservation.",
            },
            "application_event": {
                "help_text": "Application event of the recurring reservation.",
            },
            "age_group": {
                "help_text": "Age group of the recurring reservation.",
            },
            "ability_group": {
                "help_text": "Ability group of the recurring reservation.",
            },
            "first_reservation_begin": {
                "help_text": "Datetime when first reservation of the recurring reservation begins.",
            },
            "last_reservation_end": {
                "help_text": "Datetime when last reservation of the recurring reservation ends.",
            },
            "denied_reservations": {
                "help_text": "Serialized set of reservations that were denied for the recurring reservation."
            },
        }

    def get_begin_weekday(self, instance):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.begin)

            return reservations[0].begin.weekday()

        return None

    def get_first_reservation_begin(self, instance):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.begin)

            return localtime(reservations[0].begin)

        return None

    def get_last_reservation_end(self, instance):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.end)

            return localtime(reservations[0].end)

        return None

    def get_purpose_name(self, instance):
        purpose = instance.application_event.purpose
        if purpose:
            return purpose.name
        return None

    def get_group_size(self, instance):
        return instance.application_event.num_persons


class RecurringReservationFilter(filters.FilterSet):
    application_event = filters.ModelMultipleChoiceFilter(
        field_name="application_event",
        queryset=ApplicationEvent.objects.all(),
        help_text="Show only recurring reservations for specified application_events.",
    )
    application = filters.ModelMultipleChoiceFilter(
        field_name="application",
        queryset=Application.objects.all(),
        help_text="Show recurring reservations fro specified applications.",
    )
    reservation_unit = ModelInFilter(
        field_name="reservations__reservation_unit",
        queryset=ReservationUnit.objects.all(),
    )

    class Meta:
        model = RecurringReservation
        fields = []


class RecurringReservationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecurringReservationSerializer
    permission_classes = [RecurringReservationPermission]
    queryset = (
        RecurringReservation.objects.all()
        .select_related(
            "application",
            "application_event",
            "application_event__purpose",
            "age_group",
        )
        .prefetch_related(
            Prefetch(
                "reservations",
                queryset=(
                    Reservation.objects.all()
                    .select_related(
                        "user",
                        "recurring_reservation",
                        "recurring_reservation__application",
                        "recurring_reservation__application__organisation",
                        "recurring_reservation__application_event",
                    )
                    .prefetch_related(
                        Prefetch(
                            "reservation_unit",
                            queryset=(
                                ReservationUnit.objects.all()
                                .select_related("reservation_unit_type", "unit")
                                .prefetch_related(
                                    "services",
                                    "images",
                                    "unit",
                                    Prefetch(
                                        "equipments",
                                        queryset=Equipment.objects.all().only("id"),
                                    ),
                                    Prefetch(
                                        "spaces",
                                        queryset=Space.objects.all().select_related("building", "location"),
                                    ),
                                    Prefetch(
                                        "resources",
                                        queryset=Resource.objects.all().select_related("space"),
                                    ),
                                )
                            ),
                        )
                    )
                ),
            )
        )
    )
    filter_backends = [
        drf_filters.OrderingFilter,
        filters.DjangoFilterBackend,
        drf_filters.SearchFilter,
    ]
    filterset_class = RecurringReservationFilter

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        can_view_units_reservations = Q(
            reservations__reservation_unit__unit__in=get_units_where_can_view_reservations(user)
        )
        can_view_service_sectors_reservations = Q(
            reservations__reservation_unit__unit__service_sectors__in=get_service_sectors_where_can_view_reservations(
                user
            )
        )

        return queryset.filter(
            can_view_units_reservations | can_view_service_sectors_reservations | Q(user=user)
        ).distinct()
