from datetime import datetime
from decimal import Decimal

import graphene
from graphene_django_extensions.fields import RelatedField
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAuthenticated
from rest_framework.reverse import reverse

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.duration_field import Duration
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.extensions.permission_helpers import (
    check_resolver_permission,
    recurring_reservation_non_public_field,
    reservation_non_public_field,
    reservation_staff_field,
)
from api.graphql.types.merchants.types import PaymentOrderType
from api.graphql.types.reservation_units.permissions import ReservationUnitPermission
from api.graphql.types.reservations.permissions import (
    AbilityGroupPermission,
    AgeGroupPermission,
    RecurringReservationPermission,
    ReservationPermission,
    ReservationPurposePermission,
)
from api.graphql.types.users.types import UserType
from api.legacy_rest_api.utils import hmac_signature
from applications.models import City
from common.typing import GQLInfo
from merchants.models import PaymentOrder
from reservations.choices import ReservationTypeChoice as ReservationTypeField
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


class AgeGroupType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AgeGroupPermission,)

    class Meta:
        model = AgeGroup
        fields = ["minimum", "maximum"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)


class AbilityGroupType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AbilityGroupPermission,)

    class Meta:
        model = AbilityGroup
        fields = ["name"]


class RecurringReservationType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (RecurringReservationPermission,)

    user = graphene.String()
    age_group = graphene.Field(AgeGroupType)
    ability_group = graphene.Field(AbilityGroupType)
    weekdays = graphene.List(graphene.Int)
    reservation_unit = RelatedField("api.graphql.types.reservation_units.types.ReservationUnitType")

    class Meta:
        model = RecurringReservation
        fields = [
            "user",
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
        connection_class = TVPBaseConnection

    @recurring_reservation_non_public_field
    def resolve_user(root: RecurringReservation, info: GQLInfo) -> str | None:
        if not root.user:
            return None
        return root.user.email

    def resolve_weekdays(root: RecurringReservation, info: GQLInfo) -> list[graphene.List]:
        return root.weekday_list


class ReservationPurposeType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (ReservationPurposePermission,)

    class Meta:
        model = ReservationPurpose
        fields = ["pk", *get_all_translatable_fields(model)]
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)


class ReservationType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (ReservationPermission,)

    age_group = graphene.Field(AgeGroupType)
    applying_for_free_of_charge = graphene.Boolean()
    buffer_time_before = Duration()
    buffer_time_after = Duration()
    billing_first_name = graphene.String()
    billing_last_name = graphene.String()
    billing_address_street = graphene.String()
    billing_address_city = graphene.String()
    billing_address_zip = graphene.String()
    billing_phone = graphene.String()
    created_at = graphene.String()
    cancel_details = graphene.String()
    description = graphene.String()
    handled_at = graphene.DateTime()
    is_blocked = graphene.Boolean()
    is_handled = graphene.Boolean()
    name = graphene.String()
    order = graphene.Field(PaymentOrderType)
    price = graphene.Float()
    price_net = graphene.Decimal()
    reservation_units = graphene.List("api.graphql.types.reservation_units.types.ReservationUnitType")
    recurring_reservation = graphene.Field(RecurringReservationType)
    reservee_first_name = graphene.String()
    reservee_last_name = graphene.String()
    reservee_address_street = graphene.String()
    reservee_address_city = graphene.String()
    reservee_address_zip = graphene.String()
    reservee_phone = graphene.String()
    reservee_organisation_name = graphene.String()
    reservee_name = graphene.String()
    reservee_is_unregistered_association = graphene.Boolean()
    reservee_id = graphene.String()
    staff_event = graphene.Boolean(deprecation_reason="Please refer to type.")
    tax_percentage_value = graphene.Decimal()
    unit_price = graphene.Float()
    user = graphene.Field("api.graphql.types.users.types.UserType")
    purpose = graphene.Field(ReservationPurposeType)
    cancel_reason = graphene.Field(lambda: ReservationCancelReasonType)
    deny_reason = graphene.Field(lambda: ReservationDenyReasonType)

    class Meta:
        model = Reservation
        fields = [
            "age_group",
            "applying_for_free_of_charge",
            "begin",
            "billing_address_city",
            "billing_address_street",
            "billing_address_zip",
            "billing_email",
            "billing_first_name",
            "billing_last_name",
            "billing_phone",
            "buffer_time_after",
            "buffer_time_before",
            "cancel_details",
            "cancel_reason",
            "created_at",
            "deny_reason",
            "description",
            "end",
            "free_of_charge_reason",
            "handled_at",
            "handling_details",
            "home_city",
            "is_blocked",
            "is_handled",
            "name",
            "num_persons",
            "order",
            "price",
            "price_net",
            "purpose",
            "recurring_reservation",
            "reservation_units",
            "reservee_address_city",
            "reservee_address_street",
            "reservee_address_zip",
            "reservee_email",
            "reservee_first_name",
            "reservee_id",
            "reservee_is_unregistered_association",
            "reservee_last_name",
            "reservee_organisation_name",
            "reservee_phone",
            "reservee_type",
            "staff_event",
            "state",
            "tax_percentage_value",
            "type",
            "unit_price",
            "user",
            "working_memo",
        ]
        filter_fields = {
            "state": ["exact"],
            "begin": ["exact", "gte", "lte"],
        }
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    class Input:
        from_ = graphene.Field(graphene.Date, name="from")
        to = graphene.Field(graphene.Date)

    calendar_url = graphene.String()

    @reservation_non_public_field
    def resolve_age_group(root: Reservation, info: GQLInfo) -> AgeGroup | None:
        return root.age_group

    @reservation_non_public_field
    def resolve_applying_for_free_of_charge(root: Reservation, info: GQLInfo) -> bool | None:
        return root.applying_for_free_of_charge

    @reservation_non_public_field
    def resolve_billing_first_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_first_name

    @reservation_non_public_field
    def resolve_billing_last_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_last_name

    @reservation_non_public_field
    def resolve_billing_address_street(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_address_street

    @reservation_non_public_field
    def resolve_billing_address_city(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_address_city

    @reservation_non_public_field
    def resolve_billing_address_zip(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_address_zip

    @reservation_non_public_field
    def resolve_billing_phone(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_phone

    @reservation_non_public_field
    def resolve_billing_email(root: Reservation, info: GQLInfo) -> str | None:
        return root.billing_email

    def resolve_created_at(root: Reservation, info: GQLInfo) -> str:
        if root is None:  # NOSONAR
            return ""
        return root.created_at.strftime("%Y-%m-%dT%H:%M:%S%z")

    @reservation_non_public_field
    def resolve_cancel_details(root: Reservation, info: GQLInfo) -> str | None:
        return root.cancel_details

    @reservation_non_public_field
    def resolve_calendar_url(root: Reservation, info: GQLInfo) -> str:
        if root is None:
            return ""
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar-detail", kwargs={"pk": root.pk})
        signature = hmac_signature(f"reservation-{root.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"

    @reservation_non_public_field
    def resolve_description(root: Reservation, info: GQLInfo) -> str | None:
        return root.description

    @reservation_non_public_field
    def resolve_free_of_charge_reason(root: Reservation, info: GQLInfo) -> str | None:
        return root.free_of_charge_reason

    @reservation_staff_field
    def resolve_handled_at(root: Reservation, info: GQLInfo) -> datetime | None:
        return root.handled_at

    @reservation_non_public_field
    def resolve_home_city(root: Reservation, info: GQLInfo) -> City | None:
        return root.home_city

    def resolve_is_blocked(root: Reservation, info: GQLInfo) -> bool | None:
        return root.type == ReservationTypeField.BLOCKED

    @reservation_non_public_field
    def resolve_is_handled(root: Reservation, info: GQLInfo) -> bool | None:
        return root.handled_at is not None

    @reservation_non_public_field
    def resolve_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.name

    @reservation_non_public_field
    def resolve_num_persons(root: Reservation, info: GQLInfo) -> int | None:
        return root.num_persons

    @reservation_non_public_field
    def resolve_order(root: Reservation, info: GQLInfo) -> PaymentOrder | None:
        return root.payment_order.first()

    @reservation_non_public_field
    def resolve_purpose(root: Reservation, info: GQLInfo) -> ReservationPurpose | None:
        return root.purpose

    @reservation_non_public_field
    def resolve_price(root: Reservation, info: GQLInfo) -> Decimal | None:
        return root.price

    @reservation_non_public_field
    def resolve_price_net(root: Reservation, info: GQLInfo) -> Decimal | None:
        return root.price_net

    @reservation_non_public_field
    def resolve_reservee_first_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_first_name

    @reservation_non_public_field
    def resolve_reservee_last_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_last_name

    @reservation_non_public_field
    def resolve_reservee_name(root: Reservation, info: GQLInfo) -> str:
        return root.reservee_name

    @reservation_non_public_field
    def resolve_reservee_phone(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_phone

    @reservation_non_public_field
    def resolve_reservee_email(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_email

    @reservation_non_public_field
    def resolve_reservee_address_street(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_address_street

    @reservation_non_public_field
    def resolve_reservee_address_city(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_address_city

    @reservation_non_public_field
    def resolve_reservee_address_zip(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_address_zip

    @reservation_non_public_field
    def resolve_reservee_organisation_name(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_organisation_name

    @reservation_non_public_field
    def resolve_reservee_id(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_id

    @reservation_non_public_field
    def resolve_reservee_type(root: Reservation, info: GQLInfo) -> str | None:
        return root.reservee_type

    @reservation_non_public_field
    def resolve_reservee_is_unregistered_association(root: Reservation, info: GQLInfo) -> bool | None:
        return root.reservee_is_unregistered_association

    @check_resolver_permission(ReservationUnitPermission)
    def resolve_reservation_units(root: Reservation, info: GQLInfo):
        return root.reservation_unit.all()

    @reservation_staff_field
    def resolve_staff_event(root: Reservation, info: GQLInfo) -> bool | None:
        return root.type == ReservationTypeField.STAFF

    @reservation_non_public_field
    def resolve_tax_percentage_value(root: Reservation, info: GQLInfo) -> Decimal | None:
        return root.tax_percentage_value

    @reservation_staff_field
    def resolve_type(root: Reservation, info: GQLInfo) -> str | None:
        return root.type

    @reservation_non_public_field
    def resolve_unit_price(root: Reservation, info: GQLInfo) -> Decimal | None:
        return root.unit_price

    @reservation_non_public_field
    def resolve_user(root: Reservation, info: GQLInfo) -> UserType | None:
        if not root.user:
            return None
        return root.user

    @reservation_staff_field
    def resolve_working_memo(root: Reservation, info: GQLInfo) -> str | None:
        return root.working_memo

    @reservation_staff_field(default="")
    def resolve_handling_details(root: Reservation, info: GQLInfo) -> str:
        return root.handling_details

    @reservation_non_public_field
    def resolve_cancel_reason(root: Reservation, info: GQLInfo) -> ReservationCancelReason:
        return root.cancel_reason

    @reservation_non_public_field
    def resolve_deny_reason(root: Reservation, info: GQLInfo) -> ReservationDenyReason:
        return root.deny_reason


class ReservationCancelReasonType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    class Meta:
        model = ReservationCancelReason
        fields = ["pk", "reason", "reason_fi", "reason_en", "reason_sv"]
        filter_fields = ["reason"]
        interfaces = (graphene.relay.Node,)


class ReservationDenyReasonType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    class Meta:
        model = ReservationDenyReason
        fields = ["pk", "reason", "reason_fi", "reason_en", "reason_sv"]
        filter_fields = ["reason"]
        interfaces = (graphene.relay.Node,)


class ReservationMetadataSetType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    supported_fields = graphene.List(graphene.String)
    required_fields = graphene.List(graphene.String)

    def resolve_supported_fields(root: ReservationMetadataSet, info: GQLInfo):
        return root.supported_fields.all()

    def resolve_required_fields(root: ReservationMetadataSet, info: GQLInfo):
        return root.required_fields.all()

    class Meta:
        model = ReservationMetadataSet
        fields = ["pk", "name", "supported_fields", "required_fields"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
