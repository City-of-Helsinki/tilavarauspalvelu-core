import django_filters
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from permissions.helpers import can_manage_resources, get_units_with_permission
from resources.models import Resource
from spaces.models import Space

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

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        if user.is_superuser or can_manage_resources(user):
            return qs

        units = get_units_with_permission(user, "can_manage_resources")
        spaces = Space.objects.filter(unit__in=units).distinct()
        return qs.filter(space__in=spaces).distinct()
