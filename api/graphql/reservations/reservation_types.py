from typing import List, Optional

import graphene
from graphene import ResolveInfo
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAuthenticated
from rest_framework.reverse import reverse

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.duration_field import Duration
from api.graphql.translate_fields import get_all_translatable_fields
from api.graphql.users.user_types import UserType
from api.ical_api import hmac_signature
from applications.models import CUSTOMER_TYPES
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
    recurring_reservation_non_public_field,
    reservation_non_public_field,
)
from permissions.api_permissions.graphene_permissions import (
    AbilityGroupPermission,
    AgeGroupPermission,
    RecurringReservationPermission,
    ReservationPermission,
    ReservationPurposePermission,
    ReservationUnitPermission,
)
from permissions.helpers import can_handle_reservation
from reservations.models import (
    AbilityGroup,
    AgeGroup,
    RecurringReservation,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataSet,
    ReservationPurpose,
)
from reservations.models import ReservationType as ReservationTypeField


class AgeGroupType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (AgeGroupPermission,)

    class Meta:
        model = AgeGroup
        fields = ["minimum", "maximum"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)


class AbilityGroupType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (AbilityGroupPermission,)

    class Meta:
        model = AbilityGroup
        fields = ["name"]


class RecurringReservationType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (RecurringReservationPermission,)

    user = graphene.String()
    application_pk = graphene.Int()
    application_event_pk = graphene.Int()
    age_group = graphene.Field(AgeGroupType)
    ability_group = graphene.Field(AbilityGroupType)
    weekdays = graphene.List(graphene.Int)

    class Meta:
        model = RecurringReservation
        fields = [
            "user",
            "application_pk",
            "application_event_pk",
            "age_group",
            "ability_group",
            "name",
            "description",
            "reservation_unit",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
            "recurrence_in_days",
            "weekdays",
            "created",
        ]

        filter_fields = ["name"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    @recurring_reservation_non_public_field
    def resolve_user(self, info: ResolveInfo) -> Optional[str]:
        if not self.user:
            return None
        return self.user.email

    @recurring_reservation_non_public_field
    def resolve_application_pk(self, info: ResolveInfo) -> Optional[graphene.Int]:
        if not self.application_id:
            return None

        return self.application_id

    @recurring_reservation_non_public_field
    def resolve_application_event_pk(self, info: ResolveInfo) -> Optional[str]:
        if not self.application_event_id:
            return None

        return self.application_event_id

    def resolve_weekdays(self, info: ResolveInfo) -> List[graphene.List]:
        return self.weekday_list


class ReservationPurposeType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (ReservationPurposePermission,)

    class Meta:
        model = ReservationPurpose
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)


class ReservationType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (ReservationPermission,)
    created_at = graphene.String()
    user = graphene.Field("api.graphql.users.user_types.UserType")
    reservation_units = graphene.List(
        "api.graphql.reservation_units.reservation_unit_types.ReservationUnitType"
    )

    recurring_reservation = graphene.Field(RecurringReservationType)
    reservee_first_name = graphene.String()
    reservee_last_name = graphene.String()
    reservee_address_street = graphene.String()
    reservee_address_city = graphene.String()
    reservee_address_zip = graphene.String()
    reservee_phone = graphene.String()
    reservee_organisation_name = graphene.String()
    reservee_name = graphene.String()
    billing_first_name = graphene.String()
    billing_last_name = graphene.String()
    billing_address_street = graphene.String()
    billing_address_city = graphene.String()
    billing_address_zip = graphene.String()
    billing_phone = graphene.String()
    description = graphene.String()
    reservee_id = graphene.String()
    cancel_details = graphene.String()
    name = graphene.String()
    description = graphene.String()
    unit_price = graphene.Float()
    tax_percentage_value = graphene.Decimal()
    price = graphene.Float()
    age_group = graphene.Field(AgeGroupType)
    buffer_time_before = Duration()
    buffer_time_after = Duration()
    staff_event = graphene.Boolean(deprecation_reason="Please refer to type.")
    type = graphene.String()
    order_uuid = graphene.String()
    order_status = graphene.String()
    handled_at = graphene.DateTime()
    refund_uuid = graphene.String()

    class Meta:
        model = Reservation
        fields = [
            "created_at",
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
            "reservee_first_name",
            "reservee_last_name",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_email",
            "reservee_type",
            "reservee_id",
            "reservee_is_unregistered_association",
            "home_city",
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            "age_group",
            "billing_first_name",
            "billing_last_name",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            "billing_phone",
            "billing_email",
            "name",
            "description",
            "purpose",
            "unit_price",
            "tax_percentage_value",
            "price",
            "price_net",
            "working_memo",
            "cancel_details",
            "staff_event",
            "type",
            "order_uuid",
            "order_status",
            "handled_at",
            "refund_uuid",
        ]
        filter_fields = {
            "state": ["exact"],
            "priority": ["exact"],
            "begin": ["exact", "gte", "lte"],
        }
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    class Input:
        from_ = graphene.Field(graphene.Date, name="from")
        to = graphene.Field(graphene.Date)

    calendar_url = graphene.String()

    def resolve_created_at(self, info: ResolveInfo) -> str:
        if self is None:
            return ""
        return self.created_at.strftime("%Y-%m-%dT%H:%M:%S%z")

    @reservation_non_public_field
    def resolve_calendar_url(self, info: ResolveInfo) -> str:
        if self is None:
            return ""
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar-detail", kwargs={"pk": self.pk})
        signature = hmac_signature(f"reservation-{self.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"

    @reservation_non_public_field
    def resolve_user(self, info: ResolveInfo) -> Optional[UserType]:
        if not self.user:
            return None
        return self.user

    @check_resolver_permission(ReservationUnitPermission)
    def resolve_reservation_units(self, info: ResolveInfo):
        return self.reservation_unit.all()

    @reservation_non_public_field
    def resolve_reservee_first_name(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_first_name

    @reservation_non_public_field
    def resolve_reservee_last_name(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_last_name

    @reservation_non_public_field
    def resolve_reservee_name(self, info: ResolveInfo) -> Optional[str]:
        if self.reservee_type in [
            CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
            CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT,
        ]:
            return self.reservee_organisation_name
        else:
            return f"{self.reservee_first_name} {self.reservee_last_name}"

    @reservation_non_public_field
    def resolve_reservee_phone(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_phone

    def resolve_working_memo(self, info: ResolveInfo) -> Optional[str]:
        if can_handle_reservation(info.context.user, self):
            return self.working_memo
        return None

    def resolve_staff_event(self, info: ResolveInfo) -> Optional[bool]:
        if can_handle_reservation(info.context.user, self):
            return self.type == ReservationTypeField.STAFF
        return None

    def resolve_type(self, info: ResolveInfo) -> Optional[str]:
        if can_handle_reservation(info.context.user, self):
            return self.type
        return None

    def resolve_handled_at(self, info: ResolveInfo) -> Optional[str]:
        if can_handle_reservation(info.context.user, self):
            return self.handled_at
        return None

    @reservation_non_public_field
    def resolve_reservee_email(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_email

    @reservation_non_public_field
    def resolve_reservee_address_street(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_address_street

    @reservation_non_public_field
    def resolve_reservee_address_city(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_address_city

    @reservation_non_public_field
    def resolve_reservee_address_zip(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_address_zip

    @reservation_non_public_field
    def resolve_reservee_organisation_name(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_organisation_name

    @reservation_non_public_field
    def resolve_free_of_charge_reason(self, info: ResolveInfo) -> Optional[str]:
        return self.free_of_charge_reason

    @reservation_non_public_field
    def resolve_billing_first_name(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_first_name

    @reservation_non_public_field
    def resolve_billing_last_name(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_last_name

    @reservation_non_public_field
    def resolve_billing_address_street(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_address_street

    @reservation_non_public_field
    def resolve_billing_address_city(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_address_city

    @reservation_non_public_field
    def resolve_billing_address_zip(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_address_zip

    @reservation_non_public_field
    def resolve_billing_phone(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_phone

    @reservation_non_public_field
    def resolve_billing_email(self, info: ResolveInfo) -> Optional[str]:
        return self.billing_email

    @reservation_non_public_field
    def resolve_description(self, info: ResolveInfo) -> Optional[str]:
        return self.description

    @reservation_non_public_field
    def resolve_reservee_id(self, info: ResolveInfo) -> Optional[str]:
        return self.reservee_id

    @reservation_non_public_field
    def resolve_cancel_details(self, info: ResolveInfo) -> Optional[str]:
        return self.cancel_details

    @reservation_non_public_field
    def resolve_order_uuid(self, info: ResolveInfo) -> Optional[str]:
        payment_order = self.payment_order.first()
        uuid = getattr(payment_order, "remote_id", None)
        return uuid

    @reservation_non_public_field
    def resolve_order_status(self, info: ResolveInfo) -> Optional[str]:
        payment_order = self.payment_order.first()
        return payment_order.status if payment_order else None

    @reservation_non_public_field
    def resolve_refund_uuid(self, info: ResolveInfo) -> Optional[str]:
        payment_order = self.payment_order.first()
        return getattr(payment_order, "refund_id", None)


class ReservationCancelReasonType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    class Meta:
        model = ReservationCancelReason
        fields = ["pk", "reason", "reason_fi", "reason_en", "reason_sv"]
        filter_fields = ["reason"]
        interfaces = (graphene.relay.Node,)


class ReservationDenyReasonType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    class Meta:
        model = ReservationDenyReason
        fields = ["pk", "reason", "reason_fi", "reason_en", "reason_sv"]
        filter_fields = ["reason"]
        interfaces = (graphene.relay.Node,)


class ReservationMetadataSetType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    supported_fields = graphene.List(graphene.String)
    required_fields = graphene.List(graphene.String)

    def resolve_supported_fields(self, info: ResolveInfo):
        return self.supported_fields.all()

    def resolve_required_fields(self, info: ResolveInfo):
        return self.required_fields.all()

    class Meta:
        model = ReservationMetadataSet
        fields = ["pk", "name", "supported_fields", "required_fields"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
