import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from permissions.helpers import can_manage_spaces
from permissions.models import UnitPermissionChoices
from spaces.models import Space

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

        if user.is_anonymous:
            return qs.none()
        if user.is_superuser or can_manage_spaces(user):
            return qs

        unit_permission = UnitPermissionChoices.CAN_MANAGE_SPACES.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return qs.filter(models.Q(unit__in=unit_ids) | models.Q(unit__unit_groups__in=unit_group_ids)).distinct()
