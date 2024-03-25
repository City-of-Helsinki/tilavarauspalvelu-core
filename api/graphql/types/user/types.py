import datetime

import graphene
from graphene_django_extensions import DjangoNode

from api.graphql.types.user.permissions import UserPermission
from common.typing import GQLInfo
from users.helauth.utils import get_id_token, is_ad_login, is_strong_login
from users.models import User
from users.tasks import save_personal_info_view_log


class UserNode(DjangoNode):
    name = graphene.String()
    is_ad_authenticated = graphene.Boolean()
    is_strongly_authenticated = graphene.Boolean()
    reservation_notification = graphene.String()

    class Meta:
        model = User
        fields = [
            "pk",
            "uuid",
            "username",
            "name",
            "first_name",
            "last_name",
            "email",
            "date_of_birth",
            "is_superuser",
            "is_ad_authenticated",
            "is_strongly_authenticated",
            "reservation_notification",
            "general_roles",
            "unit_roles",
            "service_sector_roles",
        ]
        permission_classes = [UserPermission]

    def resolve_reservation_notification(root: User, info: GQLInfo) -> str | None:
        if root.has_staff_permissions:
            return root.reservation_notification
        return None

    def resolve_name(root: User, info: GQLInfo) -> str | None:
        return root.get_full_name()

    def resolve_date_of_birth(root: User, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth

    def resolve_is_ad_authenticated(root: User, info: GQLInfo) -> bool:
        token = get_id_token(root)
        if token is None:
            return False
        return is_ad_login(token)

    def resolve_is_strongly_authenticated(root: User, info: GQLInfo) -> bool:
        token = get_id_token(root)
        if token is None:
            return False
        return is_strong_login(token)
