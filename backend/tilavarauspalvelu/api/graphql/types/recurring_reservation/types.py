from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField, MultiField

from tilavarauspalvelu.enums import AccessType, AccessTypeWithMultivalued
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import RecurringReservation
from utils.date_utils import local_date

from .filtersets import RecurringReservationFilterSet
from .permissions import RecurringReservationPermission

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import GQLInfo, PindoraSeriesInfoData

__all__ = [
    "RecurringReservationNode",
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


class RecurringReservationNode(DjangoNode):
    weekdays = graphene.List(graphene.Int)

    access_type = AnnotatedField(graphene.Enum.from_enum(AccessTypeWithMultivalued), expression=L("access_type"))
    used_access_types = AnnotatedField(
        graphene.List(graphene.Enum.from_enum(AccessType)), expression=L("used_access_types")
    )
    should_have_active_access_code = AnnotatedField(graphene.Boolean, expression=L("should_have_active_access_code"))
    is_access_code_is_active_correct = AnnotatedField(
        graphene.Boolean, expression=L("is_access_code_is_active_correct")
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
        model = RecurringReservation
        fields = [
            "pk",
            "ext_uuid",
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
            "reservations",
            "rejected_occurrences",
            "allocated_time_slot",
            "should_have_active_access_code",
            "access_type",
            "pindora_info",
        ]
        restricted_fields = {
            "name": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "description": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "user": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "allocated_time_slot": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "should_have_active_access_code": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "pindora_info": lambda user, res: user.permissions.can_view_recurring_reservation(res),
        }
        filterset_class = RecurringReservationFilterSet
        permission_classes = [RecurringReservationPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous:
            return queryset.none()
        if not user.permissions.has_any_role():
            return queryset.filter(user=user)
        return queryset

    def resolve_weekdays(root: RecurringReservation, info: GQLInfo) -> list[int]:
        if root.weekdays:
            return [int(i) for i in root.weekdays.split(",")]
        return []

    def resolve_pindora_info(root: RecurringReservation, info: GQLInfo) -> PindoraSeriesInfoData | None:
        # Not using access codes
        if not root.should_have_active_access_code:
            return None

        # No need to show Pindora info after 24 hours have passed since the series has ended
        today = local_date()
        cutoff = root.end_date + datetime.timedelta(hours=24)
        if today > cutoff:
            return None

        has_perms = info.context.user.permissions.can_view_recurring_reservation(root, reserver_needs_role=True)

        if root.allocated_time_slot is not None:
            section = root.allocated_time_slot.reservation_unit_option.application_section
            application_round = section.application.application_round

            # Don't show Pindora info without permissions if the application round results haven't been sent yet
            if not has_perms and application_round.sent_date is None:
                return None

        try:
            response = PindoraService.get_access_code(obj=root)
        except Exception:  # noqa: BLE001
            return None

        # Don't allow reserver to view Pindora info without view permissions if the access code is not active
        if not has_perms and not response.access_code_is_active:
            return None

        return response
