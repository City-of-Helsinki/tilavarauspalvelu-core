from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, serializers, viewsets
from rest_framework.exceptions import ValidationError

from api.base import TranslatedModelSerializer
from permissions.api_permissions.drf_permissions import (
    GeneralRolePermission,
    ServiceSectorRolePermission,
    UnitRolePermission,
)
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole
from spaces.models import ServiceSector, Unit, UnitGroup

User = get_user_model()


class BaseRoleSerializer(TranslatedModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user"
    )

    def create(self, validated_data):
        request = self.context.get("request", None)
        validated_data["assigner"] = request.user if request else None

        return super().create(validated_data)


class UnitRoleSerializer(BaseRoleSerializer):
    unit_group_id = serializers.PrimaryKeyRelatedField(
        queryset=UnitGroup.objects.all(), source="unit_group", required=False, many=True
    )
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source="unit", required=False, many=True
    )
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user"
    )

    class Meta:
        model = UnitRole
        fields = ["unit_id", "unit_group_id", "user_id", "role"]
        extra_kwargs = {
            "unit_id": {
                "help_text": "Id of unit this role is related to. Either 'unit_id' or 'unit_group_id'"
                " must be specified.",
            },
            "unit_group_id": {
                "help_text": "Id of unit group this role is related to. Either 'unit_id' or 'unit_group_id'"
                " must be specified.",
            },
            "user_id": {
                "help_text": "Id of user this role is assigned to",
            },
            "role": {
                "help_text": "Code of the role choice that contains certain permissions. "
                "Choices depends on configuration. Default choices are "
                "'admin', 'manager' and 'viewer'.",
            },
        }

    def validate(self, data):
        if "unit" not in data and "unit_group" not in data:
            raise ValidationError(
                _("Either 'unit_group_id' or 'unit_id' must be specified.")
            )

        return data


class ServiceSectorRoleSerializer(BaseRoleSerializer):
    service_sector_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceSector.objects.all(), source="service_sector"
    )
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user"
    )

    class Meta:
        model = ServiceSectorRole
        fields = ["service_sector_id", "user_id", "role"]
        extra_kwargs = {
            "service_sector_id": {
                "help_text": "Id of service sector this role is related to",
            },
            "user_id": {
                "help_text": "Id of user this role is assigned to",
            },
            "role": {
                "help_text": "Code of the role choice that contains certain permissions. "
                "Choices depends on configuration. By default only choice is 'admin'.",
            },
        }


class GeneralRoleSerializer(BaseRoleSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user"
    )

    class Meta:
        model = GeneralRole
        fields = ["user_id", "role"]
        extra_kwargs = {
            "user_id": {
                "help_text": "Id of user this role is assigned to",
            },
            "role": {
                "help_text": "Code of the role choice that contains certain permissions. "
                "Choices depends on configuration. Default choices are "
                "'admin', 'manager' and 'viewer'.",
            },
        }


class UnitRoleViewSet(viewsets.ModelViewSet):
    serializer_class = UnitRoleSerializer
    permission_classes = (
        [permissions.IsAuthenticated & UnitRolePermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = UnitRole.objects.all()


class ServiceSectorRoleViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSectorRoleSerializer
    permission_classes = (
        [permissions.IsAuthenticated & ServiceSectorRolePermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = ServiceSectorRole.objects.all()


class GeneralRoleViewSet(viewsets.ModelViewSet):
    serializer_class = GeneralRoleSerializer
    permission_classes = (
        [permissions.IsAuthenticated & GeneralRolePermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
    queryset = GeneralRole.objects.all()
