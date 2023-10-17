from graphene_permissions.mixins import AuthFilter

from api.graphql.types.resources.permissions import ResourcePermission


class ResourcesFilter(AuthFilter):
    permission_classes = (ResourcePermission,)
