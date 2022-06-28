import graphene
from django.conf import settings
from django.db.models import Count
from graphene_django import DjangoListField
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny, AllowAuthenticated

from api.graphql.application_rounds.application_round_types import (
    ApplicationRoundBasketType,
)
from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.reservation_units.reservation_unit_types import ReservationUnitType
from api.graphql.translate_fields import get_all_translatable_fields
from applications.models import (
    DAY_CHOICES,
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationEventScheduleResult,
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
    ApplicationEventScheduleResultPermission,
    ApplicationPermission,
    CityPermission,
    OrganisationPermission,
)
from spaces.models import Space
from utils.query_performance import QueryPerformanceOptimizerMixin


class CityType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (CityPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = City
        fields = ["name"] + get_all_translatable_fields(model)
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class AddressType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AddressPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = Address
        fields = ("street_address", "post_code", "city")
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class PersonType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    class Meta:
        model = Person
        fields = ("id", "first_name", "last_name", "email", "phone_number")
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class OrganisationType(AuthNode, PrimaryKeyObjectType):
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


class ApplicationEventScheduleResultType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )
    allocated_reservation_unit = graphene.Field(ReservationUnitType)
    basket = graphene.Field(ApplicationRoundBasketType)
    allocated_day = graphene.Field(
        graphene.Enum("allocatedDay", [(v.upper(), k) for k, v in DAY_CHOICES])
    )

    class Meta:
        model = ApplicationEventScheduleResult
        fields = (
            "id",
            "pk",
            "accepted",
            "declined",
            "allocated_reservation_unit",
            "allocated_day",
            "allocated_begin",
            "allocated_end",
            "basket",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_pk(self, info):
        return self.pk


class ApplicationEventScheduleType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )
    day = graphene.Int()
    priority = graphene.Int()
    application_event_schedule_result = graphene.Field(
        ApplicationEventScheduleResultType
    )

    class Meta:
        model = ApplicationEventSchedule
        fields = (
            "id",
            "pk",
            "day",
            "begin",
            "end",
            "priority",
            "application_event_schedule_result",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    @check_resolver_permission(ApplicationEventScheduleResultPermission)
    def resolve_application_event_schedule_result(self, info: graphene.ResolveInfo):
        return getattr(self, "application_event_schedule_result", None)


class EventReservationUnitType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    reservation_unit = graphene.Field(ReservationUnitType)

    class Meta:
        model = EventReservationUnit
        fields = (
            "id",
            "priority",
            "reservation_unit",
        )
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_reservation_unit(self, info: graphene.ResolveInfo):
        return self.reservation_unit


class ApplicationEventType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AllowAuthenticated,) if not settings.TMP_PERMISSIONS_DISABLED else [AllowAny]
    )

    application_event_schedules = graphene.List(ApplicationEventScheduleType)

    event_reservation_units = graphene.List(EventReservationUnitType)

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
            "declined_reservation_units",
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

    def resolve_event_reservation_units(self, info: graphene.ResolveInfo):
        return self.event_reservation_units.all()

    def resolve_application_event_schedules(self, info: graphene.ResolveInfo):
        return self.application_event_schedules.all()


class ApplicationAggregatedDataType(graphene.ObjectType):
    applied_min_duration_total = graphene.Float()
    applied_reservations_total = graphene.Float()
    created_reservations_total = graphene.Float()
    reservations_duration_total = graphene.Float()


class ApplicationType(QueryPerformanceOptimizerMixin, AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ApplicationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else [AllowAny]
    )

    contact_person = graphene.Field(PersonType)

    organisation = graphene.Field(OrganisationType)

    application_events = graphene.List(ApplicationEventType)

    status = graphene.Field(
        graphene.Enum("applicationStatus", ApplicationStatus.STATUS_CHOICES)
    )

    aggregated_data = graphene.Field(
        ApplicationAggregatedDataType,
        source="aggregated_data_dict",
    )

    billing_address = graphene.Field(AddressType)

    applicant_pk = graphene.Int()
    applicant_name = graphene.String()
    applicant_email = graphene.String()

    home_city = graphene.Field(CityType)

    class Meta:
        model = Application
        fields = (
            "id",
            "pk",
            "applicant_type",
            "applicant_pk",
            "applicant_name",
            "applicant_email",
            "organisation",
            "application_round",
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

    class QueryOptimization:
        field_name = "applications"
        query_optimization = {
            "contactPerson": ("select", "contact_person"),
            "organisation": ("select", "organisation"),
            "applicantName": ("select", "user"),
            "applicantEmail": ("select", "user"),
            "aggregatedData": ("prefetch", "aggregated_data"),
            "applicationEvents": (
                "prefetch",
                {
                    "field_name": "application_events",
                    "base_queryset": ApplicationEvent.objects.all(),
                    "child_optimizations": {
                        "ageGroup": ("select", "age_group"),
                        "abilityGroup": ("select", "ability_group"),
                        "purpose": ("select", "purpose"),
                        "weeklyAmountReductionsCount": (
                            "annotate",
                            Count("weekly_amount_reductions"),
                        ),
                        "applicationEventSchedules": (
                            "prefetch",
                            "application_event_schedules",
                        ),
                        "aggregatedData": ("prefetch", "aggregated_data"),
                        "eventReservationUnits": (
                            "prefetch",
                            {
                                "field_name": "event_reservation_units",
                                "base_queryset": EventReservationUnit.objects.all(),
                                "child_optimizations": {
                                    "reservationUnit": (
                                        "select_with_child_optimizations",
                                        {
                                            "field_name": "reservation_unit",
                                            "child_optimizations": {
                                                "reservationUnitType": (
                                                    "select_for_parent",
                                                    "reservation_unit__reservation_unit_type",
                                                ),
                                                "unit": (
                                                    "select_for_parent",
                                                    "reservation_unit__unit",
                                                ),
                                                "resources": (
                                                    "prefetch_for_parent",
                                                    "reservation_unit__resources",
                                                ),
                                                "services": (
                                                    "prefetch_for_parent",
                                                    "reservation_unit__services",
                                                ),
                                                "reservationPurposes": (
                                                    "prefetch_for_parent",
                                                    "reservation_unit__reservation_purposes",
                                                ),
                                                "images": (
                                                    "prefetch_for_parent",
                                                    "reservation_unit__images",
                                                ),
                                                "equipments": (
                                                    "prefetch_for_parent",
                                                    "reservation_unit__equipments",
                                                ),
                                                "spaces": (
                                                    "prefetch_for_parent",
                                                    {
                                                        "field_name": "reservation_unit__spaces",
                                                        "always_prefetch": True,
                                                        "base_queryset": Space.objects.all().select_related(
                                                            "location",
                                                        ),
                                                        "child_optimizations": {
                                                            "building": (
                                                                "select",
                                                                "building",
                                                            ),
                                                            "location": (
                                                                "select",
                                                                "location",
                                                            ),
                                                            "resources": (
                                                                "prefetch",
                                                                "resource_set",
                                                            ),
                                                        },
                                                    },
                                                ),
                                            },
                                        },
                                    )
                                },
                            },
                        ),
                    },
                },
            ),
        }

    def resolve_applicant_pk(self, info: graphene.ResolveInfo):
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

    def resolve_application_events(self, info: graphene.ResolveInfo):
        return self.application_events.all()
