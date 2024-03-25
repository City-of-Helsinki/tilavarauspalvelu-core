from graphene_django_extensions import NestingModelSerializer

from users.models import User

__all__ = [
    "UserUpdateSerializer",
]


class UserUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = User
        fields = [
            "pk",
            "reservation_notification",
        ]
