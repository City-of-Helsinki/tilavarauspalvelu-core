from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import graphene
from django.db import models
from django.db.models import OuterRef
from django.db.models.functions import JSONObject
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField, ManuallyOptimizedField, MultiField
from query_optimizer.optimizer import QueryOptimizer
from rest_framework.reverse import reverse

from tilavarauspalvelu.api.graphql.types.user.types import UserNode
from tilavarauspalvelu.enums import (
    AccessType,
    PriceUnit,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, ReservationUnit, ReservationUnitPricing, User
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.db import SubqueryArray
from utils.utils import ical_hmac_signature

from .filtersets import ReservationFilterSet
from .permissions import ReservationPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet
    from tilavarauspalvelu.typing import AnyUser, GQLInfo, PindoraReservationInfoData

__all__ = [
    "ReservationNode",
]


class PindoraReservationInfoType(graphene.ObjectType):
    access_code = graphene.String(required=True)
    access_code_generated_at = graphene.DateTime(required=True)
    access_code_is_active = graphene.Boolean(required=True)

    access_code_keypad_url = graphene.String(required=True)
    access_code_phone_number = graphene.String(required=True)
    access_code_sms_number = graphene.String(required=True)
    access_code_sms_message = graphene.String(required=True)

    access_code_begins_at = graphene.DateTime(required=True)
    access_code_ends_at = graphene.DateTime(required=True)


class AppliedPricingInfo(graphene.ObjectType):
    begins = graphene.String(
        required=True,
        description="This is a 'Date', but graphene doesn't know how to serialize it from string...",
    )
    price_unit = graphene.Field(
        graphene.Enum.from_enum(PriceUnit),
        required=True,
    )
    lowest_price = graphene.String(
        required=True,
        description="This is a 'Decimal', but graphene doesn't know how to serialize it from string...",
    )
    highest_price = graphene.String(
        required=True,
        description="This is a 'Decimal', but graphene doesn't know how to serialize it from string...",
    )
    tax_percentage = graphene.String(
        required=True,
        description="This is a 'Decimal', but graphene doesn't know how to serialize it from string...",
    )


def private_field_check(user: AnyUser, reservation: Reservation) -> bool | None:
    result = user.permissions.can_view_reservation(reservation)
    return True if result else None


def staff_field_check(user: AnyUser, reservation: Reservation) -> bool | None:
    result = user.permissions.can_view_reservation(reservation, reserver_needs_role=True)
    return True if result else None


class ReservationNode(DjangoNode):
    reservee_name = AnnotatedField(
        graphene.String,
        expression=L("reservee_name"),
    )

    is_blocked = AnnotatedField(
        graphene.Boolean,
        expression=models.Q(type=ReservationTypeChoice.BLOCKED.value),
        required=True,
    )
    is_handled = AnnotatedField(
        graphene.Boolean,
        expression=models.Q(handled_at__isnull=False),
    )
    access_code_should_be_active = AnnotatedField(
        graphene.Boolean,
        expression=L("access_code_should_be_active"),
    )
    is_access_code_is_active_correct = AnnotatedField(
        graphene.Boolean,
        expression=L("is_access_code_is_active_correct"),
    )

    calendar_url = graphene.String()

    affected_reservation_units = AnnotatedField(
        graphene.List(graphene.Int, required=True),
        description="Which reservation units' reserveability is affected by this reservation?",
        expression=(
            SubqueryArray(
                queryset=ReservationUnit.objects.filter(reservations=OuterRef("id")).affected_reservation_unit_ids,
                agg_field="ids",
                distinct=True,
            )
        ),
    )

    applied_pricing = ManuallyOptimizedField(
        AppliedPricingInfo,
        description="Details on the pricing that should be currently applied to this reservation.",
    )

    pindora_info = MultiField(
        PindoraReservationInfoType,
        fields=["access_type", "ext_uuid", "state", "ends_at"],
        description=(
            "Info fetched from Pindora API. Cached per reservation for 30s. "
            "Please don't use this when filtering multiple reservations, queries to Pindora are not optimized."
        ),
    )

    #
    # These fields are defined "unnecessarily" since they can be null due to permission checks.
    #
    name = graphene.String()
    description = graphene.String()
    num_persons = graphene.Int()
    state = graphene.Field(graphene.Enum.from_enum(ReservationStateChoice))
    type = graphene.Field(graphene.Enum.from_enum(ReservationTypeChoice))
    handling_details = graphene.String()
    working_memo = graphene.String()
    #
    cancel_reason = graphene.Field(graphene.Enum.from_enum(ReservationCancelReasonChoice))
    cancel_details = graphene.String()
    #
    handled_at = graphene.DateTime()
    created_at = graphene.DateTime()
    #
    price = graphene.Decimal()
    price_net = graphene.Decimal()
    unit_price = graphene.Decimal()
    tax_percentage_value = graphene.Decimal()
    #
    access_type = graphene.Field(graphene.Enum.from_enum(AccessType))
    access_code_generated_at = graphene.DateTime()
    access_code_is_active = graphene.Boolean()
    #
    applying_for_free_of_charge = graphene.Boolean()
    free_of_charge_reason = graphene.String()
    #
    reservee_identifier = graphene.String()
    reservee_first_name = graphene.String()
    reservee_last_name = graphene.String()
    reservee_email = graphene.String()
    reservee_phone = graphene.String()
    reservee_address_street = graphene.String()
    reservee_address_city = graphene.String()
    reservee_address_zip = graphene.String()
    reservee_organisation_name = graphene.String()
    reservee_type = graphene.Field(graphene.Enum.from_enum(ReserveeType))
    #
    user = graphene.Field(UserNode)

    class Meta:
        model = Reservation
        fields = [
            #
            "pk",
            "ext_uuid",
            "name",
            "description",
            "num_persons",
            "state",
            "type",
            "municipality",
            "cancel_details",
            "handling_details",
            "working_memo",
            #
            "begins_at",
            "ends_at",
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
            "access_type",
            "access_code_generated_at",
            "access_code_is_active",
            "access_code_should_be_active",
            "is_access_code_is_active_correct",
            "pindora_info",
            #
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            "reservee_identifier",
            "reservee_name",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_organisation_name",
            "reservee_type",
            #
            "reservation_unit",
            "user",
            "reservation_series",
            "deny_reason",
            "cancel_reason",
            "purpose",
            "age_group",
            #
            "is_blocked",
            "is_handled",
            "payment_order",
            "calendar_url",
            "applied_pricing",
        ]
        restricted_fields = {
            field: (
                staff_field_check
                if field
                in {
                    # STAFF FIELDS
                    "type",
                    "handling_details",
                    "working_memo",
                    "handled_at",
                }
                # FIELDS ARE PRIVATE BY DEFAULT
                else private_field_check
            )
            for field in fields
            if field
            not in {
                # PUBLIC FIELDS
                "pk",
                "state",
                "begins_at",
                "ends_at",
                "buffer_time_before",
                "buffer_time_after",
                "reservation_unit",
                "is_blocked",
            }
        }
        max_complexity = 39
        filterset_class = ReservationFilterSet
        permission_classes = [ReservationPermission]

    @classmethod
    def pre_optimization_hook(cls, queryset: ReservationQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        queryset = queryset.with_permissions()

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

    def resolve_calendar_url(root: Reservation, info: GQLInfo) -> str:
        scheme = info.context.scheme
        host = info.context.get_host()
        calendar_url = reverse("reservation_calendar", kwargs={"pk": root.pk})
        signature = ical_hmac_signature(f"reservation-{root.pk}")
        return f"{scheme}://{host}{calendar_url}?hash={signature}"

    def resolve_pindora_info(root: Reservation, info: GQLInfo) -> PindoraReservationInfoData | None:
        # No Pindora info if access type is not 'ACCESS_CODE'
        if root.access_type != AccessType.ACCESS_CODE:
            return None

        # No need to show Pindora info after 24 hours have passed since it ended
        now = local_datetime()
        cutoff = root.ends_at.astimezone(DEFAULT_TIMEZONE) + datetime.timedelta(hours=24)
        if now > cutoff:
            return None

        has_perms = info.context.user.permissions.can_view_reservation(root, reserver_needs_role=True)

        # Don't allow reserver to view Pindora info without view permissions if the reservation is not confirmed
        if not has_perms and root.state != ReservationStateChoice.CONFIRMED:
            return None

        if root.reservation_series is not None and root.reservation_series.allocated_time_slot is not None:
            section = root.reservation_series.allocated_time_slot.reservation_unit_option.application_section
            application_round = section.application.application_round

            # Don't show Pindora info without permissions if the application round results haven't been sent yet
            if not has_perms and application_round.sent_at is None:
                return None

        try:
            response = PindoraService.get_access_code(obj=root)
        except Exception:  # noqa: BLE001
            return None

        # Don't allow reserver to view Pindora info without permissions if the access code is not active
        if not has_perms and not response.access_code_is_active:
            return None

        return response

    @staticmethod
    def optimize_applied_pricing(queryset: ReservationQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        optimizer.annotations["applied_pricing"] = models.Subquery(
            queryset=(
                ReservationUnitPricing.objects.filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                )
                .active(from_date=models.OuterRef("begins_at__date"))
                .annotate(
                    data=JSONObject(
                        begins=models.F("begins"),
                        price_unit=models.F("price_unit"),
                        lowest_price=models.F("lowest_price"),
                        highest_price=models.F("highest_price"),
                        tax_percentage=models.F("tax_percentage__value"),
                    ),
                )
                .values("data")[:1]
            ),
            output_field=models.JSONField(),
        )

        return queryset
