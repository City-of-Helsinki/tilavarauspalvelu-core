import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny
from graphql.execution.base import ResolveInfo
from rest_framework.reverse import reverse

from api.graphql.base_type import PrimaryKeyObjectType
from api.ical_api import hmac_signature
from permissions.api_permissions.graphene_field_decorators import (
    recurring_reservation_non_public_field,
    reservation_non_public_field,
)
from permissions.api_permissions.graphene_permissions import (
    AbilityGroupPermission,
    AgeGroupPermission,
    RecurringReservationPermission,
    ReservationPermission,
)
from reservations.models import (
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
)


class AgeGroupType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AgeGroupPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = AgeGroup
        fields = ["minimum", "maximum"]


class AbilityGroupType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (AbilityGroupPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model = AbilityGroup
        fields = ["name"]


class RecurringReservationType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (RecurringReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    user = graphene.String()
    application_pk = graphene.Int()
    application_event_pk = graphene.Int()
    age_group = graphene.Field(AgeGroupType)
    ability_group = graphene.Field(AbilityGroupType)

    class Meta:
        model = RecurringReservation
        fields = [
            "user",
            "application_pk",
            "application_event_pk",
            "age_group",
            "ability_group",
        ]

    @recurring_reservation_non_public_field
    def resolve_user(self, info: ResolveInfo) -> [str]:
        if not self.user:
            return None
        return self.user.email

    @recurring_reservation_non_public_field
    def resolve_application_pk(self, info: ResolveInfo) -> [graphene.Int]:
        if not self.application_pk:
            return None

        return self.application_pk

    @recurring_reservation_non_public_field
    def resolve_application_event_pk(self, info: ResolveInfo) -> [str]:
        if not self.application_event_pk:
            return None

        return self.application_event_pk


class ReservationType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )
    user = graphene.String()
    reservation_units = graphene.List(
        "api.graphql.reservation_units.reservation_unit_types.ReservationUnitType"
    )

    recurring_reservation = graphene.Field(RecurringReservationType)
    state = graphene.String()
    reservee_name = graphene.String()
    reservee_phone = graphene.String()
    name = graphene.String()
    description = graphene.String()

    class Meta:
        model = Reservation
        fields = [
            "state",
            "priority",
            "user",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_units",
            "recurring_reservation",
            "num_persons",
            "reservee_name",
            "reservee_phone",
            "name",
            "description",
        ]
        filter_fields = {
            "state": ["exact"],
            "priority": ["exact"],
            "begin": ["exact", "gte", "lte"],
        }
        interfaces = (graphene.relay.Node,)

    class Input:
        from_ = graphene.Field(graphene.Date, name="from")
        to = graphene.Field(graphene.Date)

    calendar_url = graphene.String()

    def resolve_calendar_url(self, info: ResolveInfo) -> str:
        if self is None:
            return ""
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar-detail", kwargs={"pk": self.pk})
        signature = hmac_signature(f"reservation-{self.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"

    @reservation_non_public_field
    def resolve_user(self, info: ResolveInfo) -> [str]:
        if not self.user:
            return None
        return self.user.email

    def resolve_reservation_units(self, info: ResolveInfo):
        return self.reservation_unit.all()
