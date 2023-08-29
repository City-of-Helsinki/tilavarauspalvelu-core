from graphene_permissions.permissions import BasePermission
from graphql import GraphQLResolveInfo


class BannerNotificationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GraphQLResolveInfo) -> bool:
        return True
