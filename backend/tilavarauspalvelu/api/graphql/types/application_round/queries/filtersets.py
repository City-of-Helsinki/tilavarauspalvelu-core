from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from lookup_property import L
from undine import Filter, FilterSet
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, UserRoleChoice
from tilavarauspalvelu.models import ApplicationRound
from utils.date_utils import local_datetime

if TYPE_CHECKING:

    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "ApplicationRoundFilterSet",
]


class ApplicationRoundFilterSet(FilterSet[ApplicationRound], auto=False):
    pk = Filter(lookup="in")
    name = Filter(lookup="istartswith")

    @Filter
    def active(self, info: GQLInfo, *, value: bool) -> models.Q:
        now = local_datetime()
        return models.Q(
            application_period_begins_at__lte=now,
            application_period_ends_at__gte=now,
            _negated=not value,
        )

    @Filter
    def ongoing(self, info: GQLInfo, *, value: bool) -> models.Q:
        return models.Q(
            ~L(status=ApplicationRoundStatusChoice.RESULTS_SENT),
            _negated=not value,
        )

    @Filter
    def only_with_permissions(self, info: GQLInfo, *, value: bool) -> models.Q:
        if not value:
            return models.Q()

        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        roles = UserRoleChoice.can_manage_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return models.Q()

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return models.Q(reservation_units__unit__in=u_ids) | models.Q(reservation_units__unit__unit_groups__in=g_ids)
