import django_filters
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.units.permissions import UnitPermission


class UnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (UnitPermission,)
