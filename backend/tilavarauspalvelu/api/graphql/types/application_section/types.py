from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField, ManuallyOptimizedField, MultiField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice, UserRoleChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Application, ApplicationSection, Reservation, User
from utils.date_utils import local_date

from .filtersets import ApplicationSectionFilterSet
from .permissions import ApplicationSectionPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet
    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet
    from tilavarauspalvelu.typing import GQLInfo, PindoraSectionInfoData

__all__ = [
    "ApplicationSectionNode",
]


class PindoraSectionValidityInfoType(graphene.ObjectType):
    reservation_id = graphene.Int(required=True)
    reservation_series_id = graphene.Int(required=True)
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

    access_code_validity = graphene.List(graphene.NonNull(PindoraSectionValidityInfoType), required=True)


class ApplicationSectionNode(DjangoNode):
    status = AnnotatedField(
        graphene.Enum.from_enum(ApplicationSectionStatusChoice),
        expression=L("status"),
        required=True,
    )
    allocations = AnnotatedField(
        graphene.Int,
        expression=L("allocations"),
        required=True,
    )

    has_reservations = ManuallyOptimizedField(graphene.Boolean, required=True)

    should_have_active_access_code = AnnotatedField(
        graphene.Boolean,
        expression=L("should_have_active_access_code"),
        required=True,
    )

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
            queryset=Reservation.objects.for_application_section(models.OuterRef("pk"))
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
        if not has_perms and root.application.application_round.sent_at is None:
            return None

        try:
            response = PindoraService.get_access_code(obj=root)
        except Exception:  # noqa: BLE001
            return None

        # Don't show Pindora info without permissions if the access code is not active
        if not has_perms and not response.access_code_is_active:
            return None

        return response
