import graphene
from django.db import models
from django.db.models import OuterRef
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField
from query_optimizer.optimizer import QueryOptimizer
from rest_framework.reverse import reverse

from api.graphql.types.merchants.types import PaymentOrderNode
from api.graphql.types.reservation.permissions import ReservationPermission
from api.legacy_rest_api.utils import hmac_signature
from common.db import SubqueryArray
from common.typing import GQLInfo
from merchants.models import PaymentOrder
from permissions.helpers import can_view_reservation
from reservation_units.models import ReservationUnit
from reservations.enums import CustomerTypeChoice, ReservationTypeChoice
from reservations.enums import ReservationTypeChoice as ReservationTypeField
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
    order = PaymentOrderNode.Field(deprecation_reason="Please use to 'paymentOrder' instead.")

    reservee_name = AnnotatedField(graphene.String, expression=L("reservee_name"))

    is_blocked = AnnotatedField(graphene.Boolean, expression=models.Q(type=ReservationTypeField.BLOCKED.value))
    is_handled = AnnotatedField(graphene.Boolean, expression=models.Q(handled_at__isnull=False))

    staff_event = AnnotatedField(
        graphene.Boolean,
        expression=models.Q(type=ReservationTypeField.STAFF.value),
        deprecation_reason="Please use to 'type' instead.",
    )

    calendar_url = graphene.String()

    affected_reservation_units = AnnotatedField(
        graphene.List(graphene.Int),
        description="Which reservation units' reserveability is affected by this reservation?",
        expression=(
            SubqueryArray(
                queryset=ReservationUnit.objects.filter(reservation=OuterRef("id")).affected_reservation_unit_ids,
                agg_field="ids",
                distinct=True,
            )
        ),
    )

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
            "payment_order",
            "staff_event",
            "calendar_url",
        ]
        restricted_fields = {
            field: (
                staff_field_check
                if field
                in [
                    # STAFF FIELDS
                    "type",
                    "handling_details",
                    "working_memo",
                    "handled_at",
                    "staff_event",
                ]
                # FIELDS ARE PRIVATE BY DEFAULT
                else private_field_check
            )
            for field in fields
            if field
            not in [
                # PUBLIC FIELDS
                "pk",
                "state",
                "begin",
                "end",
                "buffer_time_before",
                "buffer_time_after",
                "reservation_unit",
                "is_blocked",
            ]
        }
        max_complexity = 20
        filterset_class = ReservationFilterSet
        permission_classes = [ReservationPermission]

    @classmethod
    def pre_optimization_hook(cls, queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        # Add annotations for field permission checks
        optimizer.annotations["unit_ids_for_perms"] = L("unit_ids_for_perms")
        optimizer.annotations["unit_group_ids_for_perms"] = L("unit_group_ids_for_perms")

        # Add user id for permission checks
        user_optimizer = optimizer.get_or_set_child_optimizer(
            "user",
            QueryOptimizer(
                User,
                info=optimizer.info,
                name="user",
                parent=optimizer,
            ),
        )
        user_optimizer.only_fields.append("id")
        return queryset

    def resolve_order(root: Reservation, info: GQLInfo) -> PaymentOrder | None:
        # TODO: This should be removed, since it breaks optimization.
        #  Should use 'payment_order' instead.
        return root.payment_order.first()

    def resolve_calendar_url(root: Reservation, info: GQLInfo) -> str:
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar-detail", kwargs={"pk": root.pk})
        signature = hmac_signature(f"reservation-{root.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"
