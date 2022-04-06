from datetime import datetime

from dateutil.parser import parse
from django.conf import settings
from django.db.models import Q
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
)
from permissions.api_permissions.drf_permissions import (
    ApplicationEventPermission,
    ApplicationEventStatusPermission,
    ApplicationEventWeeklyAmountReductionPermission,
    ApplicationPermission,
    ApplicationStatusPermission,
)
from permissions.helpers import get_service_sectors_where_can_view_applications
from spaces.models import Unit


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

        user = self.request.user
        unit_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit", flat=True)
        units = Unit.objects.filter(id__in=unit_ids)

        return queryset.filter(
            Q(
                application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(
                application_events__event_reservation_units__reservation_unit__unit__in=units
            )
            | Q(user=user)
        ).distinct()


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
