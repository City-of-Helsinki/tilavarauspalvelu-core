import graphene
import graphene_django_optimizer as gql_optimizer
from django.conf import settings
from graphene_django import DjangoListField
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny, AllowAuthenticated

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.reservation_units.reservation_unit_types import ReservationUnitType
from api.graphql.reservations.reservation_types import (
    AbilityGroupType,
    AgeGroupType,
    ReservationPurposeType,
)
from api.graphql.translate_fields import get_all_translatable_fields
from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventStatus,
    ApplicationStatus,
    City,
    EventReservationUnit,
    Organisation,
    Person,
)
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
)
from permissions.api_permissions.graphene_permissions import (
    AddressPermission,
    ApplicationPermission,
    CityPermission,
    OrganisationPermission,
)


class CityType(gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (CityPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = City
        fields = ["name"] + get_all_translatable_fields(model)
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class AddressType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (AddressPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = Address
        fields = ("street_address", "post_code", "city")
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class PersonType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    class Meta:
        model = Person
        fields = ("id", "first_name", "last_name", "email", "phone_number")
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class OrganisationType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (OrganisationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else [AllowAny]
    )

    address = graphene.Field(AddressType)

    class Meta:
        model = Organisation
        fields = (
            "id",
            "name",
            "identifier",
            "year_established",
            "active_members",
            "organisation_type",
            "core_business",
            "email",
            "address",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ApplicationEventAggregatedDataType(graphene.ObjectType):
    duration_total = graphene.Float()
    reservations_total = graphene.Float()
    allocation_results_duration_total = graphene.Float()
    allocation_results_reservations_total = graphene.Float()


class ApplicationEventScheduleType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    class Meta:
        model = ApplicationEventSchedule
        fields = ("id", "day", "begin", "end", "priority")
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class EventReservationUnitType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    reservation_unit_id = graphene.Int()
    reservation_unit_details = graphene.Field(
        ReservationUnitType, source="reservation_unit"
    )

    class Meta:
        model = EventReservationUnit
        fields = (
            "id",
            "priority",
            "reservation_unit_id",
            "reservation_unit_details",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ApplicationEventType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    age_group_id = graphene.Int()
    ability_group_id = graphene.Int()
    application_id = graphene.Int()
    purpose_id = graphene.Int()

    application_event_schedules = DjangoListField(ApplicationEventScheduleType)

    age_group_display = graphene.Field(AgeGroupType, source="age_group")

    ability_group = graphene.Field(AbilityGroupType)

    purpose = graphene.Field(ReservationPurposeType)

    event_reservation_units = DjangoListField(EventReservationUnitType)

    status = graphene.Field(
        graphene.Enum("applicationEventStatus", ApplicationEventStatus.STATUS_CHOICES)
    )

    weekly_amount_reductions_count = graphene.Int()

    declined_reservation_units = DjangoListField(ReservationUnitType)

    aggregated_data = graphene.Field(
        ApplicationEventAggregatedDataType, source="aggregated_data_dict"
    )

    class Meta:
        model = ApplicationEvent
        fields = (
            "id",
            "name",
            "num_persons",
            "age_group_id",
            "ability_group_id",
            "min_duration",
            "max_duration",
            "application_id",
            "events_per_week",
            "biweekly",
            "begin",
            "end",
            "purpose_id",
            "uuid",
            "status",
            "application_event_schedules",
            "age_group_display",
            "ability_group",
            "purpose",
            "event_reservation_units",
            "declined_reservation_unit_ids",
            "weekly_amount_reductions_count",
            "aggregated_data",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_min_duration(self, info: graphene.ResolveInfo):
        return self.min_duration.total_seconds()

    def resolve_max_duration(self, info: graphene.ResolveInfo):
        return self.max_duration.total_seconds()

    def resolve_weekly_amount_reductions_count(self, info: graphene.ResolveInfo):
        # TODO: this can be optimized everywhere by annotating Count("weekly_amount_reductions") to queries
        return (
            self.weekly_amount_reductions__count
            if hasattr(self, "weekly_amount_reductions__count")
            else self.weekly_amount_reductions.count()
        )


class ApplicationAggregatedDataType(graphene.ObjectType):
    applied_min_duration_total = graphene.Float()
    applied_reservations_total = graphene.Float()
    created_reservations_total = graphene.Float()
    reservations_duration_total = graphene.Float()


class ApplicationType(
    gql_optimizer.OptimizedDjangoObjectType, AuthNode, PrimaryKeyObjectType
):
    permission_classes = (
        (ApplicationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else [AllowAny]
    )

    contact_person = graphene.Field(PersonType)

    organisation = graphene.Field(OrganisationType)

    application_round_id = graphene.Int()

    application_events = DjangoListField(ApplicationEventType)

    status = graphene.Field(
        graphene.Enum("applicationStatus", ApplicationStatus.STATUS_CHOICES)
    )

    aggregated_data = graphene.Field(
        ApplicationAggregatedDataType,
        source="aggregated_data_dict",
    )

    billing_address = graphene.Field(AddressType)

    applicant_id = graphene.Int()
    applicant_name = graphene.String()
    applicant_email = graphene.String()

    home_city = graphene.Field(CityType)

    class Meta:
        model = Application
        fields = (
            "id",
            "applicant_type",
            "applicant_id",
            "applicant_name",
            "applicant_email",
            "organisation",
            "application_round_id",
            "contact_person",
            "application_events",
            "status",
            "aggregated_data",
            "billing_address",
            "home_city",
            "created_date",
            "last_modified_date",
            "additional_information",
        )
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_applicant_id(self, info: graphene.ResolveInfo):
        if not self.user:
            return None

        return self.user.id

    def resolve_applicant_name(self, info: graphene.ResolveInfo):
        if not self.user:
            return None

        return self.user.get_full_name()

    def resolve_applicant_email(self, info: graphene.ResolveInfo):
        if not self.user:
            return None

        return self.user.email

    @check_resolver_permission(OrganisationPermission)
    def resolve_organisation(self, info: graphene.ResolveInfo):
        return self.organisation
