from undine import Field, GQLInfo, QueryType
from undine.relay import Node

from tilavarauspalvelu.enums import UserPermissionChoice
from tilavarauspalvelu.models import GeneralRole, User
from tilavarauspalvelu.typing import AnyUser


class GeneralRoleNode(QueryType[GeneralRole], interfaces=[Node]):
    pk = Field()
    user = Field()
    role = Field()
    assigner = Field()
    created_at = Field()
    updated_at = Field()

    @Field
    def permissions(self, info: GQLInfo[User]) -> list[UserPermissionChoice]:
        user: AnyUser = info.context.user
        if user.is_anonymous or not user.is_active:
            return []
        return user.active_general_permissions
