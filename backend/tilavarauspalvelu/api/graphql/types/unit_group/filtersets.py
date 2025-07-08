from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import UnitGroup

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import AnyUser


class UnitGroupFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")

    only_with_permission = django_filters.BooleanFilter(method="filter_by_only_with_permission")

    class Meta:
        model = UnitGroup
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "pk",
            "name_fi",
            "name_en",
            "name_sv",
        ]

    def filter_by_only_with_permission(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        """
        Returns UnitGroups that the user has direct permission to and UnitGroups that contain at least one unit that
        the user has permission to.
        """
        if not value:
            return qs

        user: AnyUser = self.request.user
        if user.is_anonymous:
            return qs.none()
        if user.is_superuser:
            return qs

        # All roles except the notification manager work with units.
        role_choices = set(UserRoleChoice) - {UserRoleChoice.NOTIFICATION_MANAGER}
        if user.permissions.has_general_role(role_choices=role_choices):
            return qs

        g_ids = list(user.active_unit_group_roles)
        u_ids = list(user.active_unit_roles)

        return qs.filter(Q(id__in=g_ids) | Q(units__id__in=u_ids)).distinct()
