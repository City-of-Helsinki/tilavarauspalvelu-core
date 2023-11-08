import graphene
from django.db import models
from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.extensions.duration_field import Duration
from api.graphql.types.application_event.filtersets import ApplicationEventFilterSet
from api.graphql.types.application_event.permissions import ApplicationEventPermission
from api.graphql.types.application_event_schedule.types import ApplicationEventScheduleNode
from applications.choices import ApplicationEventStatusChoice
from applications.models import ApplicationEvent, EventReservationUnit
from common.typing import AnyUser
from permissions.helpers import get_service_sectors_where_can_view_applications, get_units_where_can_view_applications


class EventReservationUnitNode(DjangoAuthNode):
    class Meta:
        model = EventReservationUnit
        fields = [
            "pk",
            "preferred_order",
            "reservation_unit",
        ]
        permission_classes = (AllowAuthenticated,)


class ApplicationEventNode(DjangoAuthNode):
    status = graphene.Field(graphene.Enum.from_enum(ApplicationEventStatusChoice))

    min_duration = Duration()
    max_duration = Duration()

    application_event_schedules = ApplicationEventScheduleNode.ListField()
    event_reservation_units = EventReservationUnitNode.ListField()

    class Meta:
        model = ApplicationEvent
        fields = [
            "pk",
            "application",
            "name",
            "num_persons",
            "min_duration",
            "max_duration",
            "events_per_week",
            "biweekly",
            "begin",
            "end",
            "uuid",
            "status",
            "application_event_schedules",
            "age_group",
            "ability_group",
            "purpose",
            "event_reservation_units",
            "flagged",
        ]
        filterset_class = ApplicationEventFilterSet
        permission_classes = (ApplicationEventPermission,)

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, user: AnyUser) -> models.QuerySet:
        units = get_units_where_can_view_applications(user)
        service_sectors = get_service_sectors_where_can_view_applications(user)

        return queryset.filter(
            models.Q(application__application_round__service_sector__in=service_sectors)
            | models.Q(event_reservation_units__reservation_unit__unit__in=units)
            | models.Q(application__user=user)
        ).distinct()
