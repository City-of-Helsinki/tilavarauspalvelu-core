from typing import Any, Iterable

import factory
from django.conf import settings

from permissions.models import GENERAL_PERMISSIONS
from users.models import User

from ._base import GenericDjangoModelFactory
from .role import GeneralRoleChoiceFactory, GeneralRoleFactory, GeneralRolePermissionFactory

_GENERAL_PERMISSIONS = {perm[0] for perm in GENERAL_PERMISSIONS}


__all__ = [
    "UserFactory",
]


class UserFactory(GenericDjangoModelFactory[User]):
    class Meta:
        model = User
        django_get_or_create = ["first_name", "last_name"]

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    username = factory.LazyAttribute(lambda user: f"{user.first_name.lower()}_{user.last_name.lower()}")
    email = factory.LazyAttribute(lambda user: f"{user.first_name.lower()}.{user.last_name.lower()}@example.com")
    preferred_language = settings.LANGUAGES[0][0]

    @classmethod
    def create_staff_user(cls, **kwargs: Any) -> User:
        # User considered staff user if they have any role
        return cls.create_with_general_permissions(**kwargs)

    @classmethod
    def create_with_general_permissions(cls, perms: Iterable[str] = (), **kwargs: Any) -> User:
        diff = set(perms).difference(_GENERAL_PERMISSIONS)
        if diff:
            raise RuntimeError(f"Invalid perms: {diff}")

        user = cls.create(**kwargs)

        choice = GeneralRoleChoiceFactory.create(code="general")
        GeneralRoleFactory.create(role=choice, user=user)
        for perm in perms:
            GeneralRolePermissionFactory.create(role=choice, permission=perm)

        return user
