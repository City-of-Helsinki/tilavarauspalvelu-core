from typing import TYPE_CHECKING

import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from permissions.helpers import has_general_permission
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices
from resources.models import Resource
from spaces.models import Space

if TYPE_CHECKING:
    from common.typing import AnyUser

__all__ = [
    "ResourceFilterSet",
]


class ResourceFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    class Meta:
        model = Resource
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

    def get_only_with_permission(self, qs, name, value):
        """Returns resources where the user has resource management permissions"""
        if not value:
            return qs

        user: AnyUser = self.request.user

        if user.is_anonymous:
            return qs.none()
        if user.is_superuser or has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESOURCES):
            return qs

        unit_permission = UnitPermissionChoices.CAN_MANAGE_RESOURCES.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return qs.filter(
            space__in=models.Subquery(
                queryset=(
                    Space.objects.filter(
                        models.Q(unit__in=unit_ids)  #
                        | models.Q(unit__unit_groups__in=unit_group_ids)
                    ).values("id")
                )
            )
        ).distinct()
