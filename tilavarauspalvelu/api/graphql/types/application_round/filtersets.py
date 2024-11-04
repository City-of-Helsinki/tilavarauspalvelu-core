from typing import TYPE_CHECKING

import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, UserRoleChoice
from tilavarauspalvelu.models import ApplicationRound
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser


class ApplicationRoundFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name = django_filters.CharFilter(lookup_expr="istartswith")
    active = django_filters.BooleanFilter(method="filter_by_active")
    ongoing = django_filters.BooleanFilter(method="filter_by_ongoing")
    only_with_permissions = django_filters.BooleanFilter(method="filter_by_only_with_permissions")

    class Meta:
        model = ApplicationRound

    def filter_by_active(self, queryset: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        now = local_datetime()
        return queryset.filter(
            models.Q(
                application_period_begin__lte=now,
                application_period_end__gte=now,
                _negated=not value,
            )
        )

    def filter_by_ongoing(self, queryset: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        return queryset.filter(
            models.Q(
                ~L(status=ApplicationRoundStatusChoice.RESULTS_SENT),
                _negated=not value,
            )
        )

    def filter_by_only_with_permissions(self, queryset: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if not value:
            return queryset

        user: AnyUser = self.request.user

        if user.is_anonymous or not user.is_active:
            return queryset.none()
        if user.is_superuser:
            return queryset

        roles = UserRoleChoice.can_manage_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return queryset

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return queryset.filter(
            models.Q(reservation_units__unit__in=u_ids)  #
            | models.Q(reservation_units__unit__unit_groups__in=g_ids),
        ).distinct()
