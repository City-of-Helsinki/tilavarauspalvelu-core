import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.permissions.permission_types import (
    GeneralRoleType,
    ServiceSectorRoleType,
    UnitRoleType,
)
from permissions.api_permissions.graphene_permissions import UserPermission
from permissions.helpers import can_view_users
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole
from users.models import User
from users.tasks import save_personal_info_view_log


class UserType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (UserPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    reservation_notification = graphene.String()
    general_roles = graphene.List(GeneralRoleType)
    service_sector_roles = graphene.List(ServiceSectorRoleType)
    unit_roles = graphene.List(UnitRoleType)

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
        ]
        filter_fields = ()
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_reservation_notification(self, info: graphene.ResolveInfo):
        if self.is_staff:
            return self.reservation_notification
        return None

    def resolve_general_roles(self, info: graphene.ResolveInfo):
        return GeneralRole.objects.filter(user__pk=self.pk)

    def resolve_service_sector_roles(self, info: graphene.ResolveInfo):
        return ServiceSectorRole.objects.filter(user__pk=self.pk)

    def resolve_unit_roles(self, info: graphene.ResolveInfo):
        return UnitRole.objects.filter(user__pk=self.pk)

    def resolve_date_of_birth(self, info: graphene.ResolveInfo):
        if settings.TMP_PERMISSIONS_DISABLED or can_view_users(info.context.user):
            save_personal_info_view_log.delay(
                self.pk, info.context.user.id, "User.date_of_birth"
            )
            return self.date_of_birth

        return None
