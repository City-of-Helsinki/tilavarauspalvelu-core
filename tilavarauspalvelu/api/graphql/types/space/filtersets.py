import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from permissions.enums import UserRoleChoice
from tilavarauspalvelu.models import Space

__all__ = [
    "SpaceFilterSet",
]


class SpaceFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    class Meta:
        model = Space
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "pk",
        ]

    def get_only_with_permission(self, qs: models.QuerySet, name: str, value: bool) -> models.QuerySet:
        """Returns spaces where the user has space management permissions"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous or not user.is_active:
            return qs.none()
        if user.is_superuser:
            return qs

        roles = UserRoleChoice.can_manage_reservation_units()
        if user.permissions.has_general_role(role_choices=roles):
            return qs

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return qs.filter(
            models.Q(unit__in=u_ids)  #
            | models.Q(unit__unit_groups__in=g_ids),
        ).distinct()
