import django_filters
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservation_units.permissions import ReservationUnitPermission


class ReservationUnitTypesFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)
