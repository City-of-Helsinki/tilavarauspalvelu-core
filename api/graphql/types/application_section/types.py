import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields import RelatedField
from lookup_property import L
from query_optimizer import required_annotations

from api.graphql.types.application_section.filtersets import ApplicationSectionFilterSet
from api.graphql.types.application_section.permissions import ApplicationSectionPermission
from api.graphql.types.reservation_unit_option.types import ReservationUnitOptionNode
from api.graphql.types.suitable_time_range.types import SuitableTimeRangeNode
from applications.choices import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from common.typing import GQLInfo
from permissions.helpers import get_service_sectors_where_can_view_applications, get_units_where_can_view_applications


class ApplicationSectionNode(DjangoNode):
    status = graphene.Field(graphene.Enum.from_enum(ApplicationSectionStatusChoice))
    allocations = graphene.Field(graphene.Int)

    reservation_unit_options = ReservationUnitOptionNode.ListField()
    suitable_time_ranges = SuitableTimeRangeNode.ListField()
    purpose = RelatedField("api.graphql.types.reservations.types.ReservationPurposeType")
    age_group = RelatedField("api.graphql.types.reservations.types.AgeGroupType")

    affecting_allocated_time_slots = graphene.List(
        "api.graphql.types.allocated_time_slot.types.AllocatedTimeSlotNode",
        reservation_unit=graphene.Int(),
    )

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "name",
            "num_persons",
            "reservations_begin_date",
            "reservations_end_date",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "allocations",
            "age_group",
            "purpose",
            "application",
            "reservation_unit_options",
            "suitable_time_ranges",
            "status",
        ]
        filterset_class = ApplicationSectionFilterSet
        permission_classes = [ApplicationSectionPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        units = get_units_where_can_view_applications(info.context.user)
        service_sectors = get_service_sectors_where_can_view_applications(info.context.user)

        return queryset.filter(
            models.Q(application__application_round__service_sector__in=service_sectors)
            | models.Q(reservation_unit_options__reservation_unit__unit__in=units)
            | models.Q(application__user=info.context.user)
        ).distinct()

    @required_annotations(status=L("status"))
    def resolve_status(root: ApplicationSection, info: GQLInfo) -> ApplicationSectionStatusChoice:
        return root.status

    @required_annotations(allocations=L("allocations"))
    def resolve_allocations(root: ApplicationSection, info: GQLInfo) -> int:
        return root.allocations

    def resolve_affecting_allocated_time_slots(
        root: ApplicationSection,
        info: GQLInfo,
        reservation_unit: int,
    ) -> models.QuerySet:
        """Return all allocations that affect this"""
        # Note: Querying this field still causes 1 additional query for each application section.
        # Currently, there is no way to optimize it, since it's an "indirect" relation which requires
        # an input field (i.e. can't use `@required_annotations`).
        return root.actions.affecting_allocations(reservation_unit=reservation_unit)
