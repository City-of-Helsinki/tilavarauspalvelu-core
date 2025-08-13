import datetime
from typing import Any

from django.db import models
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import ReservationSeries, User
from tilavarauspalvelu.models.reservation_series.queryset import ReservationSeriesQuerySet
from tilavarauspalvelu.typing import PindoraSeriesInfoData
from utils.date_utils import local_date

from .filtersets import ReservationSeriesFilterSet
from .orderset import ReservationSeriesOrderSet

__all__ = [
    "ReservationSeriesNode",
]


class ReservationSeriesNode(
    QueryType[ReservationSeries],
    filterset=ReservationSeriesFilterSet,
    orderset=ReservationSeriesOrderSet,
    interfaces=[Node],
):
    pk = Field()
    ext_uuid = Field()
    name = Field()
    description = Field()
    created_at = Field()

    begin_time = Field()
    end_time = Field()
    begin_date = Field()
    end_date = Field()
    weekdays = Field()
    recurrence_in_days = Field()

    user = Field()
    age_group = Field()
    reservation_unit = Field()
    reservations = Field()
    rejected_occurrences = Field()
    allocated_time_slot = Field()

    access_type = Field(L("access_type"))
    used_access_types = Field(L("used_access_types"))
    should_have_active_access_code = Field(L("should_have_active_access_code"))
    is_access_code_is_active_correct = Field(L("is_access_code_is_active_correct"))

    @Field
    def pindora_info(root: ReservationSeries, info: GQLInfo[User]) -> PindoraSeriesInfoData | None:
        """
        Info fetched from Pindora API. Cached per reservation for 30s.
        Please don't use this when filtering multiple series, queries to Pindora are not optimized.
        """
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

    @pindora_info.optimize
    def optimize_pindora_info(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("end_date")
        data.only_fields.add("ext_uuid")
        data.annotations["should_have_active_access_code"] = L("should_have_active_access_code")

        time_slots_data = data.add_select_related("allocated_time_slot")
        option_data = time_slots_data.add_select_related("reservation_unit_option")

        section_data = option_data.add_select_related("application_section")
        section_data.only_fields.add("ext_uuid")

        application_data = section_data.add_select_related("application")
        application_round_data = application_data.add_select_related("application_round")
        application_round_data.only_fields.add("sent_at")

    @name.permissions
    @description.permissions
    @user.permissions
    @allocated_time_slot.permissions
    @should_have_active_access_code.permissions
    @pindora_info.permissions
    def staff_permissions(root: ReservationSeries, info: GQLInfo[User], value: Any) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_view_reservation_series(root):
            msg = "No permission to access field."
            raise GraphQLPermissionError(msg)

    @name.optimize
    @description.optimize
    @user.optimize
    @allocated_time_slot.optimize
    @should_have_active_access_code.optimize
    @pindora_info.optimize
    def staff_optimizations(self, data: OptimizationData, info: GQLInfo) -> None:
        data.add_select_related("user")
        reservation_unit_data = data.add_select_related("reservation_unit")
        unit_data = reservation_unit_data.add_select_related("unit")
        unit_data.add_prefetch_related("unit_groups")

    @classmethod
    def __permissions__(cls, instance: ReservationSeries, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access node."
            raise GraphQLPermissionError(msg)

        if user == instance.user:
            return

        if not user.permissions.has_any_role():
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo) -> None:
        data.add_select_related("user")

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationSeriesQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            return queryset.none()

        if user.permissions.has_any_role():
            return queryset

        return queryset.filter(user=user)
