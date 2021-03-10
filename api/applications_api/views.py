from datetime import datetime

from dateutil.parser import parse
from django.conf import settings
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets

from api.applications_api.filters import ApplicationFilter
from api.applications_api.serializers import (
    ApplicationEventSerializer,
    ApplicationSerializer,
)
from applications.models import Application, ApplicationEvent
from permissions.api_permissions import (
    ApplicationEventPermission,
    ApplicationPermission,
)
from permissions.helpers import get_service_sectors_where_can_view_applications


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
        user = self.request.user

        return queryset.filter(
            Q(
                application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(user=user)
        )


class ApplicationEventViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationEventSerializer
    permission_classes = (
        [ApplicationEventPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = ApplicationEvent.objects.all()

    def get_serializer_context(self):
        start: datetime = self.request.query_params.get("start", None)
        end: datetime = self.request.query_params.get("end", None)
        if start is not None:
            start = parse(start)
        if end is not None:
            end = parse(end)
        return {"start": start, "end": end}

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        return queryset.filter(
            Q(
                application__application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(application__user=user)
        )
