from graphene_permissions.mixins import AuthFilter

from api.graphql.types.tax_percentage.permissions import TaxPercentagePermission


class TaxPercentageFilter(AuthFilter):
    permission_classes = (TaxPercentagePermission,)
