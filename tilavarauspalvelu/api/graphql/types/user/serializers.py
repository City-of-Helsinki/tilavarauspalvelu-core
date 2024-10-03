from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import User

__all__ = [
    "UserStaffUpdateSerializer",
]


class UserStaffUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = User
        fields = [
            "pk",
            "reservation_notification",
        ]
