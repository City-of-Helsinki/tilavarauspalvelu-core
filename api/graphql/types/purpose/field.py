from graphene_permissions.mixins import AuthFilter

from api.graphql.types.purpose.permissions import PurposePermission


class PurposeFilter(AuthFilter):
    permission_classes = (PurposePermission,)
