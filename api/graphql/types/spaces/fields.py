from graphene_permissions.mixins import AuthFilter

from api.graphql.types.spaces.permissions import ServiceSectorPermission, SpacePermission


class SpacesFilter(AuthFilter):
    permission_classes = (SpacePermission,)


class ServiceSectorFilter(AuthFilter):
    permission_classes = (ServiceSectorPermission,)
