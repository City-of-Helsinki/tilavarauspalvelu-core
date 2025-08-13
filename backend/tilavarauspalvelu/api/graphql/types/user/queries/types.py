import datetime

from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import ReservationNotification
from tilavarauspalvelu.models import User
from tilavarauspalvelu.tasks import save_personal_info_view_log_task

__all__ = [
    "UserNode",
]


class UserNode(QueryType[User], interfaces=[Node]):
    pk = Field()
    uuid = Field()

    username = Field()
    first_name = Field()
    last_name = Field()
    email = Field()

    is_superuser = Field()

    general_roles = Field()
    unit_roles = Field()

    @Field
    def name(root: User, info: GQLInfo[User]) -> str:
        return root.get_full_name()

    @name.optimize
    def optimize_name(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("first_name")
        data.only_fields.add("last_name")

    @Field
    def reservation_notification(root: User, info: GQLInfo[User]) -> ReservationNotification | None:
        if root.permissions.has_any_role():
            return root.reservation_notification
        return None

    @Field
    def date_of_birth(root: User, info: GQLInfo[User]) -> datetime.date | None:
        save_personal_info_view_log_task.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth

    @Field
    def is_ad_authenticated(root: User, info: GQLInfo[User]) -> bool:
        token = root.id_token
        if token is None:
            return False
        return token.is_ad_login

    @Field
    def is_strongly_authenticated(root: User, info: GQLInfo[User]) -> bool:
        token = root.id_token
        if token is None:
            return False
        return token.is_strong_login

    @Field
    def is_internal_user(root: User, info: GQLInfo[User]) -> bool:
        return root.actions.is_internal_user

    @is_internal_user.optimize
    def optimize_is_internal_user(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("email")

    @classmethod
    def __permissions__(cls, instance: User, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.permissions.can_view_user(instance):
            msg = "No permission to access user."
            raise GraphQLPermissionError(msg)
