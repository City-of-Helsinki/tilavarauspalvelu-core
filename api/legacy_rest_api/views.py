import datetime
import hmac
import io

from dateutil.parser import parse
from django.conf import settings
from django.db.models import Prefetch, Q, Sum
from django.http import FileResponse
from django_filters import rest_framework as filters
from rest_framework import filters as drf_filters
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from api.legacy_rest_api.permissions import (
    RecurringReservationPermission,
    ReservationPermission,
    ReservationUnitPermission,
)
from opening_hours.utils.summaries import get_resources_total_hours_per_resource
from permissions.helpers import get_service_sectors_where_can_view_reservations, get_units_where_can_view_reservations
from reservation_units.models import Equipment, ReservationUnit
from reservations.models import RecurringReservation, Reservation
from resources.models import Resource
from spaces.models import Space

from .filtersets import RecurringReservationFilter, ReservationFilter, ReservationUnitFilter
from .serializers import RecurringReservationSerializer, ReservationSerializer, ReservationUnitSerializer
from .utils import export_reservation_events, get_host, hmac_signature, reservation_unit_calendar


class ReservationIcalViewset(ViewSet):
    queryset = Reservation.objects.all()

    def get_object(self):
        return Reservation.objects.filter(pk=self.kwargs["pk"]).prefetch_related("reservation_unit").first()

    def retrieve(self, request, *args, **kwargs):
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


class RecurringReservationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecurringReservationSerializer
    permission_classes = [RecurringReservationPermission]
    queryset = (
        RecurringReservation.objects.all()
        .select_related(
            "age_group",
            "application_event_schedule__application_event__purpose",
        )
        .prefetch_related(
            Prefetch(
                "reservations",
                queryset=(
                    Reservation.objects.all()
                    .select_related(
                        "user",
                        (
                            "recurring_reservation__application_event_schedule__"
                            "application_event__application__organisation"
                        ),
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


class ReservationUnitViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationUnitSerializer
    filter_backends = [
        drf_filters.OrderingFilter,
        filters.DjangoFilterBackend,
        drf_filters.SearchFilter,
    ]
    ordering_fields = ["name", "max_persons_sum"]
    filterset_class = ReservationUnitFilter
    search_fields = ["name"]
    permission_classes = [ReservationUnitPermission]

    def get_queryset(self):
        qs = (
            ReservationUnit.objects.annotate(max_persons_sum=Sum("spaces__max_persons"))
            .all()
            .select_related("reservation_unit_type", "unit")
            .prefetch_related(
                "services",
                "images",
                "unit",
                "purposes",
                Prefetch("equipments", queryset=Equipment.objects.all().only("id")),
                Prefetch(
                    "spaces",
                    queryset=Space.objects.all().select_related("building", "location"),
                ),
                Prefetch("resources", queryset=Resource.objects.all().select_related("space")),
            )
        )
        return qs

    @action(detail=False, methods=["get"])
    def capacity(self, request, pk=None):
        reservation_units = request.query_params.get("reservation_unit")
        period_start: str | None = self.request.query_params.get("period_start")
        period_end: str | None = self.request.query_params.get("period_end")

        if not (period_start and period_end):
            raise serializers.ValidationError("Parameters period_start and period_end are required.")
        try:
            period_start_date: datetime.date = parse(period_start).date()
            period_end_date: datetime.date = parse(period_end).date()
        except (ValueError, OverflowError) as err:
            raise serializers.ValidationError("Wrong date format. Use YYYY-MM-dd") from err

        if not reservation_units:
            raise serializers.ValidationError("reservation_unit parameter is required.")

        try:
            reservation_units = [int(res_unit) for res_unit in reservation_units.split(",")]
        except ValueError as err:
            raise serializers.ValidationError("Given reservation unit id is not an integer") from err

        reservation_unit_qs = ReservationUnit.objects.filter(id__in=reservation_units)

        hauki_resource_ids = (
            reservation_unit_qs.filter(origin_hauki_resource__isnull=False)
            .values_list("origin_hauki_resource_id", flat=True)
            .distinct()
        )
        total_opening_hours = get_resources_total_hours_per_resource(
            hauki_resource_ids,
            period_start_date,
            period_end_date,
        )

        result_data = []
        for res_unit in reservation_unit_qs:
            total_duration = (
                Reservation.objects.going_to_occur()
                .filter(reservation_unit=res_unit)
                .within_period(period_start=period_start_date, period_end=period_end_date)
                .total_duration()
            ).get("total_duration")

            total_duration = total_duration.total_seconds() / 3600 if total_duration else 0
            resource_id = f"{settings.HAUKI_ORIGIN_ID}:{res_unit.uuid}"
            result_data.append(
                {
                    "id": res_unit.id,
                    "hour_capacity": total_opening_hours.get(resource_id),
                    "reservation_duration_total": total_duration,
                    "period_start": period_start_date,
                    "period_end": period_end_date,
                }
            )
        return Response(result_data)


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
            "recurring_reservation__application_event_schedule__application_event__application__organisation",
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
