from datetime import datetime

from dateutil.parser import parse
from django.conf import settings
from django.db.models import Count, Prefetch, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, permissions, viewsets

from api.applications_api.filters import (
    ApplicationEventWeeklyAmountReductionFilter,
    ApplicationFilter,
)
from api.applications_api.serializers import (
    ApplicationEventSerializer,
    ApplicationEventStatusSerializer,
    ApplicationEventWeeklyAmountReductionSerializer,
    ApplicationSerializer,
    ApplicationStatusSerializer,
)
from applications.models import (
    Application,
    ApplicationEvent,
    ApplicationEventStatus,
    ApplicationEventWeeklyAmountReduction,
    ApplicationStatus,
    EventReservationUnit,
)
from permissions.api_permissions.drf_permissions import (
    ApplicationEventPermission,
    ApplicationEventStatusPermission,
    ApplicationEventWeeklyAmountReductionPermission,
    ApplicationPermission,
    ApplicationStatusPermission,
)
from permissions.helpers import get_service_sectors_where_can_view_applications
from reservation_units.models import ReservationUnit
from spaces.models import Space, Unit


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ApplicationFilter
    permission_classes = (
        [ApplicationPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )

    def get_queryset(self):
        queryset = super().get_queryset()

        if settings.TMP_PERMISSIONS_DISABLED:
            return queryset

        # Filtering queries formation
        user = self.request.user
        unit_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit", flat=True)
        group_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit_group", flat=True)
        units = Unit.objects.filter(
            Q(id__in=unit_ids) | Q(unit_groups__in=group_ids)
        ).values_list("id", flat=True)

        # Subqueries for optimization formation
        declined_reservation_units_qs = ReservationUnit.objects.all().only("id")
        spaces_qs = Space.objects.all().select_related("building", "location")
        event_reservation_units_qs = (
            EventReservationUnit.objects.all()
            .select_related(
                "reservation_unit",
                "reservation_unit__reservation_unit_type",
                "reservation_unit__unit",
            )
            .prefetch_related(
                "reservation_unit__resources",
                "reservation_unit__services",
                "reservation_unit__images",
                "reservation_unit__equipments",
                Prefetch(
                    "reservation_unit__spaces",
                    queryset=spaces_qs,
                ),
            )
        )
        application_event_qs = (
            ApplicationEvent.objects.all()
            .annotate(Count("weekly_amount_reductions"))
            .select_related(
                "age_group",
                "ability_group",
                "purpose",
            )
            .prefetch_related(
                "application_event_schedules",
                "aggregated_data",
                Prefetch(
                    "event_reservation_units",
                    queryset=event_reservation_units_qs,
                ),
                Prefetch(
                    "declined_reservation_units",
                    queryset=declined_reservation_units_qs,
                ),
            )
        )

        # Main query formation
        queryset = (
            queryset.filter(
                Q(
                    application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                        user
                    )
                )
                | Q(
                    application_events__event_reservation_units__reservation_unit__unit__in=units
                )
                | Q(user=user)
            )
            .select_related(
                "contact_person",
                "organisation",
                "organisation__address",
                "billing_address",
            )
            .prefetch_related(
                "aggregated_data",
                Prefetch(
                    "application_events",
                    queryset=application_event_qs,
                ),
            )
            .distinct()
        )
        return queryset


class ApplicationEventViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationEventSerializer
    permission_classes = (
        [ApplicationEventPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = ApplicationEvent.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        start: datetime = self.request.query_params.get("start", None)
        end: datetime = self.request.query_params.get("end", None)
        if start is not None:
            start = parse(start)
        if end is not None:
            end = parse(end)

        context.update({"start": start, "end": end})
        return context

    def get_queryset(self):
        queryset = super().get_queryset()

        # Subqueries for optimization formation
        declined_reservation_units_qs = ReservationUnit.objects.all().only("id")
        spaces_qs = Space.objects.all().select_related("building", "location")
        event_reservation_units_qs = (
            EventReservationUnit.objects.all()
            .select_related(
                "reservation_unit",
                "reservation_unit__reservation_unit_type",
                "reservation_unit__unit",
            )
            .prefetch_related(
                "reservation_unit__resources",
                "reservation_unit__services",
                "reservation_unit__images",
                "reservation_unit__equipments",
                Prefetch(
                    "reservation_unit__spaces",
                    queryset=spaces_qs,
                ),
            )
        )

        queryset = (
            queryset.annotate(Count("weekly_amount_reductions"))
            .select_related("age_group", "ability_group", "purpose")
            .prefetch_related(
                "application_event_schedules",
                "aggregated_data",
                Prefetch(
                    "event_reservation_units",
                    queryset=event_reservation_units_qs,
                ),
                Prefetch(
                    "declined_reservation_units",
                    queryset=declined_reservation_units_qs,
                ),
            )
        )

        if settings.TMP_PERMISSIONS_DISABLED:
            return queryset

        user = self.request.user

        return queryset.filter(
            Q(
                application__application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(application__user=user)
        )


class ApplicationStatusViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationStatusSerializer
    permission_classes = (
        [ApplicationStatusPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = ApplicationStatus.objects.all()

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)


class ApplicationEventStatusViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationEventStatusSerializer
    permission_classes = (
        [ApplicationEventStatusPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = ApplicationEventStatus.objects.all()

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)


class ApplicationEventWeeklyAmountReductionViewSet(
    viewsets.GenericViewSet,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
):

    serializer_class = ApplicationEventWeeklyAmountReductionSerializer

    queryset = ApplicationEventWeeklyAmountReduction.objects.all()

    filter_backends = [DjangoFilterBackend]
    filterset_class = ApplicationEventWeeklyAmountReductionFilter

    permission_classes = (
        [ApplicationEventWeeklyAmountReductionPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
