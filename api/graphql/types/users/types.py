import datetime

import graphene
from django.db.models import QuerySet
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import DjangoAuthNode, TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from api.graphql.types.permissions.types import GeneralRoleType, ServiceSectorRoleType, UnitRoleType
from api.graphql.types.users.permissions import ApplicantPermission, UserPermission
from common.typing import GQLInfo
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole
from users.models import User
from users.tasks import save_personal_info_view_log


class UserType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (UserPermission,)

    reservation_notification = graphene.String()
    general_roles = graphene.List(GeneralRoleType)
    service_sector_roles = graphene.List(ServiceSectorRoleType)
    unit_roles = graphene.List(UnitRoleType)
    is_ad_authenticated = graphene.Boolean()
    is_strongly_authenticated = graphene.Boolean()

    class Meta:
        model = User
        fields = [
            "pk",
            "is_superuser",
            "username",
            "first_name",
            "last_name",
            "email",
            "uuid",
            "reservation_notification",
            "general_roles",
            "service_sector_roles",
            "unit_roles",
            "date_of_birth",
            "is_ad_authenticated",
            "is_strongly_authenticated",
        ]
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_reservation_notification(root: User, info: GQLInfo) -> str | None:
        if root.has_staff_permissions:
            return root.reservation_notification
        return None

    def resolve_general_roles(root: User, info: GQLInfo) -> QuerySet[GeneralRole]:
        return GeneralRole.objects.filter(user__pk=root.pk)

    def resolve_service_sector_roles(root: User, info: GQLInfo) -> QuerySet[ServiceSectorRole]:
        return ServiceSectorRole.objects.filter(user__pk=root.pk)

    def resolve_unit_roles(root: User, info: GQLInfo) -> QuerySet[UnitRole]:
        return UnitRole.objects.filter(user__pk=root.pk)

    def resolve_date_of_birth(root: User, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth


class ApplicantNode(DjangoAuthNode):
    name = graphene.String()

    class Meta:
        model = User
        fields = [
            "pk",
            "name",
            "email",
            "date_of_birth",
        ]
        permissions_classes = (ApplicantPermission,)

    def resolve_name(root: User, info: GQLInfo) -> str | None:
        return root.get_full_name()

    def resolve_date_of_birth(root: User, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth


class UserNode(DjangoAuthNode):
    is_ad_authenticated = graphene.Boolean()
    is_strongly_authenticated = graphene.Boolean()

    class Meta:
        model = User
        fields = [
            "pk",
            "is_superuser",
            "username",
            "first_name",
            "last_name",
            "email",
            "uuid",
            "reservation_notification",
            "general_roles",
            "service_sector_roles",
            "unit_roles",
            "date_of_birth",
            "is_ad_authenticated",
            "is_strongly_authenticated",
        ]
        permission_classes = (UserPermission,)

    def resolve_reservation_notification(root: User, info: GQLInfo) -> str | None:
        if root.has_staff_permissions:
            return root.reservation_notification
        return None

    def resolve_date_of_birth(root: User, info: GQLInfo) -> datetime.date | None:
        save_personal_info_view_log.delay(root.pk, info.context.user.id, "User.date_of_birth")
        return root.date_of_birth
