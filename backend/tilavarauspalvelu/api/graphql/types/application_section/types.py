from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any, NamedTuple

import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField, ManuallyOptimizedField, MultiField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, UserRoleChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import Application, ApplicationSection, Reservation, User
from utils.date_utils import local_date

from .filtersets import ApplicationSectionFilterSet
from .permissions import ApplicationSectionPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet
    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet
    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "ApplicationSectionNode",
]


class PindoraSectionValidityInfoData(NamedTuple):
    access_code_begins_at: datetime.datetime
    access_code_ends_at: datetime.datetime


class PindoraSectionInfoData(NamedTuple):
    access_code: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool

    access_code_keypad_url: str
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str

    access_code_validity: list[PindoraSectionValidityInfoData]


class PindoraSectionValidityInfoType(graphene.ObjectType):
    access_code_begins_at = graphene.DateTime(required=True)
    access_code_ends_at = graphene.DateTime(required=True)


class PindoraSectionInfoType(graphene.ObjectType):
    access_code = graphene.String(required=True)
    access_code_generated_at = graphene.DateTime(required=True)
    access_code_is_active = graphene.Boolean(required=True)

    access_code_keypad_url = graphene.String(required=True)
    access_code_phone_number = graphene.String(required=True)
    access_code_sms_number = graphene.String(required=True)
    access_code_sms_message = graphene.String(required=True)

    access_code_validity = graphene.List(PindoraSectionValidityInfoType, required=True)


class ApplicationSectionNode(DjangoNode):
    status = AnnotatedField(graphene.Enum.from_enum(ApplicationSectionStatusChoice), expression=L("status"))
    allocations = AnnotatedField(graphene.Int, expression=L("allocations"))

    has_reservations = ManuallyOptimizedField(graphene.Boolean, required=True)

    should_have_active_access_code = AnnotatedField(graphene.Boolean, expression=L("should_have_active_access_code"))

    pindora_info = MultiField(
        PindoraSectionInfoType,
        fields=["ext_uuid", "reservations_end_date"],
        description=(
            "Info fetched from Pindora API. Cached per reservation for 30s. "
            "Please don't use this when filtering multiple sections, queries to Pindora are not optimized."
        ),
    )

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "ext_uuid",
            "name",
            "num_persons",
            "reservations_begin_date",
            "reservations_end_date",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "allocations",
            "age_group",
            "purpose",
            "application",
            "reservation_unit_options",
            "suitable_time_ranges",
            "status",
            "should_have_active_access_code",
        ]
        filterset_class = ApplicationSectionFilterSet
        permission_classes = [ApplicationSectionPermission]
        max_complexity = 14

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous or not user.is_active:
            return queryset.none()
        if user.is_superuser:
            return queryset

        roles = UserRoleChoice.can_view_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return queryset

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return queryset.filter(
            models.Q(application__user=user)
            | models.Q(reservation_unit_options__reservation_unit__unit__in=u_ids)
            | models.Q(reservation_unit_options__reservation_unit__unit__unit_groups__in=g_ids)
        ).distinct()

    @classmethod
    def pre_optimization_hook(cls, queryset: ApplicationSectionQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        # Fetch the application and its units for permission checks
        application_optimizer = optimizer.get_or_set_child_optimizer(
            "application",
            QueryOptimizer(
                Application,
                info=optimizer.info,
                name="application",
                parent=optimizer,
            ),
        )
        application_optimizer.manual_optimizers["units_for_permissions"] = cls._add_units_for_permissions

        # Add user id for permission checks
        user_optimizer = application_optimizer.get_or_set_child_optimizer(
            "user",
            QueryOptimizer(
                User,
                info=optimizer.info,
                name="user",
                parent=application_optimizer,
            ),
        )
        user_optimizer.only_fields.append("id")
        return queryset

    @classmethod
    def _add_units_for_permissions(cls, queryset: ApplicationQuerySet, *args: Any) -> models.QuerySet:
        return queryset.with_permissions()

    @staticmethod
    def optimize_has_reservations(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        optimizer.annotations["has_reservations"] = models.Exists(
            Reservation.objects.filter(
                recurring_reservation__allocated_time_slot__reservation_unit_option__application_section=(
                    models.OuterRef("pk")
                ),
            )
        )

        return queryset

    def resolve_pindora_info(root: ApplicationSection, info: GQLInfo) -> PindoraSectionInfoData | None:
        # Not using access codes
        if not root.should_have_active_access_code:
            return None

        # No need to show Pindora info after 24 hours have passed since the section has ended
        today = local_date()
        cutoff = root.reservations_end_date + datetime.timedelta(hours=24)
        if today > cutoff:
            return None

        has_perms = info.context.user.permissions.can_manage_application(root.application, reserver_needs_role=True)

        # Don't show Pindora info without permissions if the application round results haven't been sent yet
        if not has_perms and root.application.application_round.sent_date is None:
            return None

        try:
            response = PindoraClient.get_seasonal_booking(section=root.ext_uuid)
        except Exception:  # noqa: BLE001
            return None

        # Don't show Pindora info without permissions if the access code is not active
        access_code_is_active = response["access_code_is_active"]
        if not has_perms and not access_code_is_active:
            return None

        return PindoraSectionInfoData(
            access_code=response["access_code"],
            access_code_generated_at=response["access_code_generated_at"],
            access_code_is_active=response["access_code_is_active"],
            access_code_keypad_url=response["access_code_keypad_url"],
            access_code_phone_number=response["access_code_phone_number"],
            access_code_sms_number=response["access_code_sms_number"],
            access_code_sms_message=response["access_code_sms_message"],
            access_code_validity=[
                PindoraSectionValidityInfoData(
                    access_code_begins_at=(
                        validity["begin"] - datetime.timedelta(minutes=validity["access_code_valid_minutes_before"])
                    ),
                    access_code_ends_at=(
                        validity["end"] + datetime.timedelta(minutes=validity["access_code_valid_minutes_after"])
                    ),
                )
                for validity in response["reservation_unit_code_validity"]
            ],
        )
