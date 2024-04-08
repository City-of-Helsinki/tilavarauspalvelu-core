import graphene
from graphene_django_extensions import DjangoNode
from query_optimizer import DjangoListField
from rest_framework.reverse import reverse

from api.graphql.types.merchants.types import PaymentOrderNode
from api.graphql.types.reservation.permissions import ReservationPermission
from api.legacy_rest_api.utils import hmac_signature
from common.typing import GQLInfo
from merchants.models import PaymentOrder
from permissions.helpers import can_view_reservation
from reservations.choices import CustomerTypeChoice, ReservationTypeChoice
from reservations.choices import ReservationTypeChoice as ReservationTypeField
from reservations.models import Reservation
from users.models import User

from .filtersets import ReservationFilterSet

__all__ = [
    "ReservationNode",
]


def private_field_check(user: User, reservation: Reservation) -> bool | None:
    result = can_view_reservation(user, reservation)
    return True if result else None


def staff_field_check(user: User, reservation: Reservation) -> bool | None:
    result = can_view_reservation(user, reservation, needs_staff_permissions=True)
    return True if result else None


class ReservationNode(DjangoNode):
    order = PaymentOrderNode.Field()
    reservee_name = graphene.String()
    is_blocked = graphene.Boolean()
    is_handled = graphene.Boolean()
    staff_event = graphene.Boolean(deprecation_reason="Please refer to type.")
    calendar_url = graphene.String()

    # Needs to be singular since the many-to-many field is also singular,
    # and otherwise the optimizer cannot optimize this properly.
    reservation_unit = DjangoListField("api.graphql.types.reservation_unit.types.ReservationUnitNode")

    #
    # These fields are defined "unnecessarily" since they can be null due to permission checks.
    #
    name = graphene.String()
    description = graphene.String()
    num_persons = graphene.Int()
    type = graphene.Field(graphene.Enum.from_enum(ReservationTypeChoice))
    cancel_details = graphene.String()
    handling_details = graphene.String()
    working_memo = graphene.String()
    #
    handled_at = graphene.DateTime()
    created_at = graphene.DateTime()
    #
    price = graphene.Decimal()
    price_net = graphene.Decimal()
    unit_price = graphene.Decimal()
    tax_percentage_value = graphene.Decimal()
    #
    applying_for_free_of_charge = graphene.Boolean()
    free_of_charge_reason = graphene.String()
    #
    reservee_id = graphene.String()
    reservee_first_name = graphene.String()
    reservee_last_name = graphene.String()
    reservee_email = graphene.String()
    reservee_phone = graphene.String()
    reservee_address_street = graphene.String()
    reservee_address_city = graphene.String()
    reservee_address_zip = graphene.String()
    reservee_is_unregistered_association = graphene.Boolean()
    reservee_organisation_name = graphene.String()
    reservee_type = graphene.Field(graphene.Enum.from_enum(CustomerTypeChoice))
    #
    billing_first_name = graphene.String()
    billing_last_name = graphene.String()
    billing_email = graphene.String()
    billing_phone = graphene.String()
    billing_address_street = graphene.String()
    billing_address_city = graphene.String()
    billing_address_zip = graphene.String()

    class Meta:
        model = Reservation
        fields = [
            #
            "pk",
            "name",
            "description",
            "num_persons",
            "state",
            "type",
            "cancel_details",
            "handling_details",
            "working_memo",
            #
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "handled_at",
            "created_at",
            #
            "price",
            "price_net",
            "unit_price",
            "tax_percentage_value",
            #
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            "reservee_id",
            "reservee_name",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_is_unregistered_association",
            "reservee_organisation_name",
            "reservee_type",
            #
            "billing_first_name",
            "billing_last_name",
            "billing_email",
            "billing_phone",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            "reservation_unit",
            "user",
            "recurring_reservation",
            "deny_reason",
            "cancel_reason",
            "purpose",
            "home_city",
            "age_group",
            #
            "is_blocked",
            "is_handled",
            "order",
            "staff_event",
            "calendar_url",
        ]
        restricted_fields = {
            #
            "name": private_field_check,
            "description": private_field_check,
            "num_persons": private_field_check,
            "type": staff_field_check,
            "cancel_details": private_field_check,
            "handling_details": staff_field_check,
            "working_memo": staff_field_check,
            #
            "handled_at": staff_field_check,
            "created_at": private_field_check,
            #
            "price": private_field_check,
            "price_net": private_field_check,
            "unit_price": private_field_check,
            "tax_percentage_value": private_field_check,
            #
            "applying_for_free_of_charge": private_field_check,
            "free_of_charge_reason": private_field_check,
            #
            "reservee_id": private_field_check,
            "reservee_name": private_field_check,
            "reservee_first_name": private_field_check,
            "reservee_last_name": private_field_check,
            "reservee_email": private_field_check,
            "reservee_phone": private_field_check,
            "reservee_organisation_name": private_field_check,
            "reservee_address_street": private_field_check,
            "reservee_address_city": private_field_check,
            "reservee_address_zip": private_field_check,
            "reservee_is_unregistered_association": private_field_check,
            "reservee_type": private_field_check,
            #
            "billing_first_name": private_field_check,
            "billing_last_name": private_field_check,
            "billing_email": private_field_check,
            "billing_phone": private_field_check,
            "billing_address_street": private_field_check,
            "billing_address_city": private_field_check,
            "billing_address_zip": private_field_check,
            #
            "user": private_field_check,
            "deny_reason": private_field_check,
            "cancel_reason": private_field_check,
            "purpose": private_field_check,
            "home_city": private_field_check,
            "age_group": private_field_check,
            #
            "is_handled": private_field_check,
            "order": private_field_check,
            "staff_event": staff_field_check,
            "calendar_url": private_field_check,
        }
        max_complexity = 20
        filterset_class = ReservationFilterSet
        permission_classes = [ReservationPermission]

    def resolve_order(root: Reservation, info: GQLInfo) -> PaymentOrder | None:
        return root.payment_order.first()

    def resolve_is_blocked(root: Reservation, info: GQLInfo) -> bool | None:
        return root.type == ReservationTypeField.BLOCKED

    def resolve_is_handled(root: Reservation, info: GQLInfo) -> bool | None:
        return root.handled_at is not None

    def resolve_staff_event(root: Reservation, info: GQLInfo) -> bool | None:
        return root.type == ReservationTypeField.STAFF

    def resolve_calendar_url(root: Reservation, info: GQLInfo) -> str:
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar-detail", kwargs={"pk": root.pk})
        signature = hmac_signature(f"reservation-{root.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"
