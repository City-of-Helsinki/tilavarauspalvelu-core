import datetime

import graphene
from django.db.models import Value
from django.db.models.functions import Concat, Trim
from graphene_django_extensions import DjangoNode
from query_optimizer import AnnotatedField

from common.typing import GQLInfo
from tilavarauspalvelu.models import User
from tilavarauspalvelu.tasks import save_personal_info_view_log

from .permissions import UserPermission

__all__ = [
    "ApplicantNode",
    "UserNode",
]


_FIELDS = [
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
]


class UserNode(DjangoNode):
    name = AnnotatedField(graphene.String, expression=Trim(Concat("first_name", Value(" "), "last_name")))

    is_ad_authenticated = graphene.Boolean()
    is_strongly_authenticated = graphene.Boolean()
    reservation_notification = graphene.String()

    class Meta:
        model = User
        fields = _FIELDS
        permission_classes = [UserPermission]

    def resolve_reservation_notification(root: User, info: GQLInfo) -> str | None:
        if root.permissions.has_any_role():
            return root.reservation_notification
        return None

    def resolve_date_of_birth(root: User, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth

    def resolve_is_ad_authenticated(root: User, info: GQLInfo) -> bool:
        token = root.id_token
        if token is None:
            return False
        return token.is_ad_login

    def resolve_is_strongly_authenticated(root: User, info: GQLInfo) -> bool:
        token = root.id_token
        if token is None:
            return False
        return token.is_strong_login


class ApplicantNode(UserNode):
    class Meta:
        model = User
        fields = _FIELDS
        # Don't override the default `UserNode` in the registry.
        # This node should only be used with the `ApplicationNode`.
        skip_registry = True
        # No need to check permissions, since permissions for the
        # `ApplicationNode` are enough to access the `ApplicantNode`.
        permission_classes = []
