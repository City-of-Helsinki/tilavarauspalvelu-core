from typing import Optional

from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.base import TranslatedModelSerializer
from api.permissions_api import (
    GeneralRoleSerializer,
    ServiceSectorRoleSerializer,
    UnitRoleSerializer,
)
from permissions.api_permissions.drf_permissions import UserPermission
from permissions.helpers import can_view_users

User = get_user_model()


class UserSerializer(TranslatedModelSerializer):
    general_roles = GeneralRoleSerializer(many=True)
    service_sector_roles = ServiceSectorRoleSerializer(many=True)
    unit_roles = UnitRoleSerializer(many=True)
    reservation_notification = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "is_superuser",
            "username",
            "first_name",
            "last_name",
            "email",
            "uuid",
            "preferred_language",
            "general_roles",
            "service_sector_roles",
            "unit_roles",
            "reservation_notification",
        ]
        extra_kwargs = {
            "is_superuser": {
                "help_text": "A flag that indicates if user is a superuser.",
            },
            "username": {
                "help_text": "Username of the user.",
            },
            "first_name": {
                "help_text": "First name of the user.",
            },
            "last_name": {
                "help_text": "Last name of the user.",
            },
            "email": {
                "help_text": "Email address of the user.",
            },
            "uuid": {
                "help_text": "UUID of the user. Usually comes from SSO provider.",
            },
            "preferred_language": {
                "help_text": "Language that user prefers for UI.",
            },
            "general_roles": {
                "help_text": "List of general roles that user has been granted.",
            },
            "service_sector_roles": {
                "help_text": "List of service sector roles that user has been granted.",
            },
            "unit_roles": {
                "help_text": "List of unit roles that user has been granted.",
            },
        }

    def get_reservation_notification(self, user) -> Optional[str]:
        if user.is_staff:
            return user.reservation_notification
        return None


class UserViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    serializer_class = UserSerializer
    queryset = User.objects.all().prefetch_related(
        "general_roles", "service_sector_roles", "unit_roles"
    )
    permission_classes = [UserPermission]

    @action(detail=False, methods=["get"])
    def current(self, request):
        user = request.user
        if not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if settings.TMP_PERMISSIONS_DISABLED or can_view_users(user):
            return queryset
        user = self.request.user

        return queryset.filter(id=user.id)
