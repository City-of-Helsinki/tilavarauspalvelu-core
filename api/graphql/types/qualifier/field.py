from graphene_permissions.mixins import AuthFilter

from api.graphql.types.qualifier.permissions import QualifierPermission


class QualifierFilter(AuthFilter):
    permission_classes = (QualifierPermission,)
