from typing import TYPE_CHECKING

import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from applications.models import ApplicationRound
from common.date_utils import local_datetime
from permissions.helpers import has_general_permission

if TYPE_CHECKING:
    from common.typing import AnyUser


class ApplicationRoundFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name = django_filters.CharFilter(lookup_expr="istartswith")
    active = django_filters.BooleanFilter(method="filter_by_active")
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

    def filter_by_only_with_permissions(self, queryset: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        if not value:
            return queryset

        request_user: AnyUser = self.request.user

        if request_user.is_anonymous:
            return queryset.none()
        if request_user.is_superuser:
            return queryset

        required_permissions = ["can_validate_applications", "can_handle_applications"]

        if any(has_general_permission(request_user, perm) for perm in required_permissions):
            return queryset

        units: list[int] = [
            unit_id
            for unit_id, unit_perms in request_user.unit_permissions.items()
            if any(perm in required_permissions for perm in unit_perms)
        ]
        unit_groups: list[int] = [
            unit_group_id
            for unit_group_id, unit_group_perms in request_user.unit_group_permissions.items()
            if any(perm in required_permissions for perm in unit_group_perms)
        ]

        return queryset.filter(
            models.Q(reservation_units__unit__in=units)
            | models.Q(reservation_units__unit__unit_groups__in=unit_groups),
        ).distinct()
