import django_filters
from django.db import models
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from permissions.helpers import can_manage_spaces, get_units_with_permission
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
        elif user.is_superuser or can_manage_spaces(user):
            return qs

        units = get_units_with_permission(user, "can_manage_spaces")
        return qs.filter(models.Q(unit__in=units)).distinct()
