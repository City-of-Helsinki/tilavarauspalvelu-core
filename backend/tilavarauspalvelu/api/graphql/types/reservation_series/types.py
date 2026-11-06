from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import graphene
from django.db import models
from django.db.models.functions import Coalesce
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField, ManuallyOptimizedField, MultiField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.api.graphql.types.price_option.types import PriceOptionNode
from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued, ReservationStateChoice, Weekday
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    ApplicationSection,
    PriceOption,
    Reservation,
    ReservationSeries,
    ReservationUnitOption,
)
from utils.date_utils import local_date

from .filtersets import ReservationSeriesFilterSet
from .permissions import ReservationSeriesPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo, PindoraSeriesInfoData

__all__ = [
    "ReservationSeriesNode",
]


class PindoraSeriesValidityInfoType(graphene.ObjectType):
    reservation_id = graphene.Int(required=True)
    reservation_series_id = graphene.Int(required=True)
    access_code_begins_at = graphene.DateTime(required=True)
    access_code_ends_at = graphene.DateTime(required=True)


class PindoraSeriesInfoType(graphene.ObjectType):
    access_code = graphene.String(required=True)
    access_code_generated_at = graphene.DateTime(required=True)
    access_code_is_active = graphene.Boolean(required=True)

    access_code_keypad_url = graphene.String(required=True)
    access_code_phone_number = graphene.String(required=True)
    access_code_sms_number = graphene.String(required=True)
    access_code_sms_message = graphene.String(required=True)

    access_code_validity = graphene.List(graphene.NonNull(PindoraSeriesValidityInfoType), required=True)


class ReservationSeriesNode(DjangoNode):
    access_type = AnnotatedField(
        graphene.Enum.from_enum(AccessTypeWithMultivalued),
        expression=L("access_type"),
        required=True,
    )
    used_access_types = AnnotatedField(
        graphene.List(graphene.Enum.from_enum(AccessType)),
        expression=L("used_access_types"),
        required=True,
    )
    should_have_active_access_code = AnnotatedField(
        graphene.Boolean,
        expression=L("should_have_active_access_code"),
        required=True,
    )
    is_access_code_is_active_correct = AnnotatedField(
        graphene.Boolean,
        expression=L("is_access_code_is_active_correct"),
        required=True,
    )
    weekdays = graphene.Field(
        graphene.List(graphene.Enum.from_enum(Weekday)),
        required=True,
    )

    price = AnnotatedField(
        graphene.Decimal,
        expression=Coalesce(
            models.Subquery(
                Reservation.objects
                .filter(
                    reservation_series=models.OuterRef("pk"),
                    state__in=ReservationStateChoice.states_going_to_occur,
                )
                .values("reservation_series")
                .annotate(total=models.Sum("price"))
                .values("total")[:1]
            ),
            models.Value(Decimal(0)),
        ),
        description="Sum of the prices of the reservations in the series that are going to occur.",
    )
    price_option = ManuallyOptimizedField(
        PriceOptionNode,
        description="Price option of the application section that the series was made for.",
    )

    pindora_info = MultiField(
        PindoraSeriesInfoType,
        fields=["ext_uuid", "end_date"],
        description=(
            "Info fetched from Pindora API. Cached per reservation for 30s. "
            "Please don't use this when filtering multiple series, queries to Pindora are not optimized."
        ),
    )

    class Meta:
        model = ReservationSeries
        fields = [
            "pk",
            "ext_uuid",
            "user",
            "age_group",
            "name",
            "description",
            "reservation_unit",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
            "recurrence_in_days",
            "weekdays",
            "created_at",
            "reservations",
            "rejected_occurrences",
            "allocated_time_slot",
            "should_have_active_access_code",
            "access_type",
            "pindora_info",
            "price",
            "price_option",
        ]
        restricted_fields = {
            "name": lambda user, res: user.permissions.can_view_reservation_series(res),
            "description": lambda user, res: user.permissions.can_view_reservation_series(res),
            "user": lambda user, res: user.permissions.can_view_reservation_series(res),
            "allocated_time_slot": lambda user, res: user.permissions.can_view_reservation_series(res),
            "should_have_active_access_code": lambda user, res: user.permissions.can_view_reservation_series(res),
            "pindora_info": lambda user, res: user.permissions.can_view_reservation_series(res),
            "price": lambda user, res: user.permissions.can_view_reservation_series(res),
            "price_option": lambda user, res: user.permissions.can_view_reservation_series(res),
        }
        filterset_class = ReservationSeriesFilterSet
        permission_classes = [ReservationSeriesPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous:
            return queryset.none()
        if not user.permissions.has_any_role():
            return queryset.filter(user=user)
        return queryset

    @staticmethod
    def optimize_price_option(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        optimizer.only_fields.append("allocated_time_slot")
        allocation_optimizer = optimizer.get_or_set_child_optimizer(
            name="allocated_time_slot",
            optimizer=QueryOptimizer(
                AllocatedTimeSlot,
                optimizer.info,
                name="allocated_time_slot",
                parent=optimizer,
            ),
        )

        allocation_optimizer.only_fields.append("reservation_unit_option")
        option_optimizer = allocation_optimizer.get_or_set_child_optimizer(
            name="reservation_unit_option",
            optimizer=QueryOptimizer(
                ReservationUnitOption,
                optimizer.info,
                name="reservation_unit_option",
                parent=allocation_optimizer,
            ),
        )

        option_optimizer.only_fields.append("application_section")
        section_optimizer = option_optimizer.get_or_set_child_optimizer(
            name="application_section",
            optimizer=QueryOptimizer(
                ApplicationSection,
                optimizer.info,
                name="application_section",
                parent=option_optimizer,
            ),
        )

        section_optimizer.only_fields.append("price_option")
        price_option_optimizer = section_optimizer.get_or_set_child_optimizer(
            name="price_option",
            optimizer=QueryOptimizer(
                PriceOption,
                optimizer.info,
                name="price_option",
                parent=section_optimizer,
            ),
        )

        # The field returns a whole price option node, so load every column.
        price_option_optimizer.only_fields.extend(field.attname for field in PriceOption._meta.concrete_fields)
        return queryset

    def resolve_price_option(root: ReservationSeries, info: GQLInfo) -> PriceOption | None:
        if root.allocated_time_slot is None:
            return None
        return root.allocated_time_slot.reservation_unit_option.application_section.price_option

    def resolve_pindora_info(root: ReservationSeries, info: GQLInfo) -> PindoraSeriesInfoData | None:
        # Not using access codes
        if not root.should_have_active_access_code:
            return None

        # No need to show Pindora info after 24 hours have passed since the series has ended
        today = local_date()
        cutoff = root.end_date + datetime.timedelta(hours=24)
        if today > cutoff:
            return None

        has_perms = info.context.user.permissions.can_view_reservation_series(root, reserver_needs_role=True)

        if root.allocated_time_slot is not None:
            section = root.allocated_time_slot.reservation_unit_option.application_section
            application_round = section.application.application_round

            # Don't show Pindora info without permissions if the application round results haven't been sent yet
            if not has_perms and application_round.sent_at is None:
                return None

        try:
            response = PindoraService.get_access_code(obj=root)
        except Exception:  # noqa: BLE001
            return None

        # Don't allow reserver to view Pindora info without view permissions if the access code is not active
        if not has_perms and not response.access_code_is_active:
            return None

        return response
