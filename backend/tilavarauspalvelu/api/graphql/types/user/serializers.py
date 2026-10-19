from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import User

__all__ = [
    "CurrentUserUpdateSerializer",
    "UserStaffUpdateSerializer",
]


class CurrentUserUpdateSerializer(NestingModelSerializer[User]):
    class Meta:
        model = User
        fields = [
            "pk",
            "preferred_language",
        ]
        extra_kwargs = {
            "pk": {
                "read_only": True,
            },
        }


class UserStaffUpdateSerializer(NestingModelSerializer[User]):
    class Meta:
        model = User
        fields = [
            "pk",
            "reservation_notification",
        ]
