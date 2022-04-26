import graphene
from django.conf import settings
from django.db.models import Sum
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.reservation_units.reservation_unit_types import ReservationUnitType
from api.graphql.translate_fields import get_all_translatable_fields
from applications.models import (
    ApplicationEventAggregateData,
    ApplicationRound,
    ApplicationRoundBasket,
    ApplicationRoundStatus,
    ApplicationStatus,
)
from permissions.api_permissions.graphene_permissions import ApplicationRoundPermission
from spaces.models import ServiceSector

from ..base_connection import TilavarausBaseConnection
from ..reservations.reservation_types import ReservationPurposeType


class AggregatedDataType(graphene.ObjectType):
    allocation_result_events_count = graphene.Int()
    allocation_duration_total = graphene.Int()
    total_reservation_duration = graphene.Int()
    total_hour_capacity = graphene.Int()


class ServiceSectorType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ApplicationRoundPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model = ServiceSector
        fields = ("id",)
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ApplicationRoundBasketType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ApplicationRoundPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    purpose_ids = graphene.List(graphene.Int)
    age_group_ids = graphene.List(graphene.Int)
    home_city_id = graphene.Int()

    class Meta:
        model = ApplicationRoundBasket
        fields = (
            "id",
            "name",
            "purpose_ids",
            "must_be_main_purpose_of_applicant",
            "customer_type",
            "age_group_ids",
            "home_city_id",
            "allocation_percentage",
            "order_number",
        )
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_purpose_ids(self, info: graphene.ResolveInfo):
        return self.purposes.all().values_list("id", flat=True)

    def resolve_age_group_ids(self, info: graphene.ResolveInfo):
        return self.age_groups.all().values_list("id", flat=True)

    def resolve_home_city_id(self, info: graphene.ResolveInfo):
        return getattr(self.home_city, "id", None)


class ApplicationRoundType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ApplicationRoundPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    service_sector = graphene.Field(ServiceSectorType)
    status = graphene.Field(
        graphene.Enum("status", ApplicationRoundStatus.STATUS_CHOICES)
    )
    status_timestamp = graphene.DateTime()

    # With resolvers
    purposes = graphene.List(ReservationPurposeType)
    reservation_units = graphene.List(ReservationUnitType)
    application_round_baskets = graphene.List(ApplicationRoundBasketType)
    aggregated_data = graphene.Field(AggregatedDataType)
    approved_by = graphene.String()
    applications_sent = graphene.Boolean()

    class Input:
        active = graphene.Field(graphene.Boolean)

    class Meta:
        model = ApplicationRound
        fields = [
            "id",
            "reservation_units",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "purposes",
            "service_sector",
            "status",
            "status_timestamp",
            "application_round_baskets",
            "allocating",
            "aggregated_data",
            "approved_by",
            "applications_sent",
            "target_group",
        ] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_aggregated_data(self, info: graphene.ResolveInfo):
        events_count = (
            ApplicationEventAggregateData.objects.filter(
                application_event__application__application_round=self,
                name="allocation_results_reservations_total",
            )
            .distinct()
            .aggregate(events_count=Sum("value"))
        )
        duration_total = (
            ApplicationEventAggregateData.objects.filter(
                application_event__application__application_round=self,
                name="allocation_results_duration_total",
            )
            .distinct()
            .aggregate(duration_total=Sum("value"))
        )

        allocation_result_dict = {
            "allocation_result_events_count": events_count.get("events_count", 0),
            "allocation_duration_total": duration_total.get("duration_total", 0),
        }
        allocation_result_dict.update(self.aggregated_data_dict)

        return allocation_result_dict

    def resolve_approved_by(self, info: graphene.ResolveInfo):
        request_user = getattr(info.context, "user", None)

        if not request_user or not request_user.is_authenticated:
            return ""

        approved_status = self.statuses.filter(
            status=ApplicationRoundStatus.APPROVED
        ).first()

        if not getattr(approved_status, "user", None):
            return ""

        return approved_status.user.get_full_name()

    def resolve_applications_sent(self, info: graphene.ResolveInfo):
        not_sent = self.applications.filter(
            cached_latest_status__in=[
                ApplicationStatus.IN_REVIEW,
                ApplicationStatus.REVIEW_DONE,
            ]
        ).exists()

        return not not_sent

    def resolve_reservation_units(self, info: graphene.ResolveInfo):
        return self.reservation_units.all()

    def resolve_purposes(self, info: graphene.ResolveInfo):
        return self.purposes.all()

    def resolve_application_round_baskets(self, info: graphene.ResolveInfo):
        return self.application_round_baskets.all()
