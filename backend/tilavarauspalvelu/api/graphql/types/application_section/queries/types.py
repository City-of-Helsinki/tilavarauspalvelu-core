import datetime
from typing import TypedDict

from django.db import models
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import ApplicationSection, Reservation, User
from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet
from utils.date_utils import local_date

from .filtersets import ApplicationSectionFilterSet
from .orderset import ApplicationSectionOrderSet

__all__ = [
    "ApplicationSectionNode",
]


class PindoraSectionValidityInfoType(TypedDict):
    reservation_id: int
    reservation_series_id: int
    access_code_begins_at: datetime.datetime
    access_code_ends_at: datetime.datetime


class PindoraSectionInfoType(TypedDict):
    access_code: str
    access_code_generated_at: datetime.datetime
    access_code_is_active: bool

    access_code_keypad_url: str
    access_code_phone_number: str
    access_code_sms_number: str
    access_code_sms_message: str

    access_code_validity: list[PindoraSectionValidityInfoType]


class ApplicationSectionNode(
    QueryType[ApplicationSection],
    filterset=ApplicationSectionFilterSet,
    orderset=ApplicationSectionOrderSet,
    interfaces=[Node],
):
    pk = Field()
    ext_uuid = Field()

    name = Field()
    num_persons = Field()
    reservations_begin_date = Field()
    reservations_end_date = Field()

    reservation_min_duration = Field()
    reservation_max_duration = Field()
    applied_reservations_per_week = Field()

    application = Field()
    purpose = Field()
    age_group = Field()
    reservation_unit_options = Field()
    suitable_time_ranges = Field()

    status = Field(L("status"))
    allocations = Field(L("allocations"))
    should_have_active_access_code = Field(L("should_have_active_access_code"))

    has_reservations = Field(
        models.Exists(
            queryset=Reservation.objects.all().for_application_section(models.OuterRef("pk")),
        ),
    )

    @Field
    def pindora_info(root: ApplicationSection, info: GQLInfo[User]) -> PindoraSectionInfoType | None:
        """
        Info fetched from Pindora API. Cached per reservation for 30s.
        Please don't use this when filtering multiple sections, queries to Pindora are not optimized.
        """
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

        return PindoraSectionInfoType(
            access_code=response.access_code,
            access_code_generated_at=response.access_code_generated_at,
            access_code_is_active=response.access_code_is_active,
            access_code_keypad_url=response.access_code_keypad_url,
            access_code_phone_number=response.access_code_phone_number,
            access_code_sms_number=response.access_code_sms_number,
            access_code_sms_message=response.access_code_sms_message,
            access_code_validity=[
                PindoraSectionValidityInfoType(
                    reservation_id=validity.reservation_id,
                    reservation_series_id=validity.reservation_series_id,
                    access_code_begins_at=validity.access_code_begins_at,
                    access_code_ends_at=validity.access_code_ends_at,
                )
                for validity in response.access_code_validity
            ],
        )

    @pindora_info.optimize
    def optimize_pindora_info(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("ext_uuid")
        data.only_fields.add("reservations_end_date")
        data.annotations["should_have_active_access_code"] = L("should_have_active_access_code")

        application_data = data.add_select_related("application")

        application_round_data = application_data.add_select_related("application_round")
        application_round_data.only_fields.add("sent_at")

    @classmethod
    def __permissions__(cls, instance: ApplicationSection, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "You must be authenticated to view this section."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __filter_queryset__(
        cls,
        queryset: ApplicationSectionQuerySet,
        info: GQLInfo[User],
    ) -> models.QuerySet[ApplicationSection]:
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
