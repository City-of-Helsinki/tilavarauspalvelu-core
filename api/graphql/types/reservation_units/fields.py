import django_filters
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservation_units.permissions import (
    EquipmentCategoryPermission,
    EquipmentPermission,
    KeywordPermission,
    PurposePermission,
    QualifierPermission,
    ReservationUnitCancellationRulePermission,
    ReservationUnitPermission,
    TaxPercentagePermission,
)


class ReservationUnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)

    @classmethod
    def resolve_queryset(cls, connection, iterable, info, args, filtering_args, filterset_class):
        queryset = super().resolve_queryset(connection, iterable, info, args, filtering_args, filterset_class)
        # Hide archived reservation units
        return queryset.filter(is_archived=False)


class ReservationUnitTypesFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)


class KeywordFilter(AuthFilter):
    permission_classes = (KeywordPermission,)


class EquipmentFilter(AuthFilter):
    permission_classes = (EquipmentPermission,)


class EquipmentCategoryFilter(AuthFilter):
    permission_classes = (EquipmentCategoryPermission,)


class PurposeFilter(AuthFilter):
    permission_classes = (PurposePermission,)


class QualifierFilter(AuthFilter):
    permission_classes = (QualifierPermission,)


class ReservationUnitCancellationRulesFilter(AuthFilter):
    permission_classes = (ReservationUnitCancellationRulePermission,)


class TaxPercentageFilter(AuthFilter):
    permission_classes = (TaxPercentagePermission,)
