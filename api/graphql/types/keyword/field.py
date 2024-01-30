from graphene_permissions.mixins import AuthFilter

from api.graphql.types.keyword.permissions import KeywordPermission


class KeywordFilter(AuthFilter):
    permission_classes = (KeywordPermission,)
