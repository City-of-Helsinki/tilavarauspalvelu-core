from collections.abc import Iterable
from typing import Any

import factory
from django.conf import settings

from permissions.models import GENERAL_PERMISSIONS, SERVICE_SECTOR_PERMISSIONS, UNIT_PERMISSIONS
from spaces.models import ServiceSector, Unit, UnitGroup
from users.models import User

from ._base import GenericDjangoModelFactory
from .role import (
    GeneralRoleChoiceFactory,
    GeneralRoleFactory,
    GeneralRolePermissionFactory,
    ServiceSectorRoleChoiceFactory,
    ServiceSectorRoleFactory,
    ServiceSectorRolePermissionFactory,
    UnitRoleChoiceFactory,
    UnitRoleFactory,
    UnitRolePermissionFactory,
)

_GENERAL_PERMISSIONS = {perm[0] for perm in GENERAL_PERMISSIONS}
_SERVICE_SECTOR_PERMISSIONS = {perm[0] for perm in SERVICE_SECTOR_PERMISSIONS}
_UNIT_PERMISSIONS = {perm[0] for perm in UNIT_PERMISSIONS}


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
    date_of_birth = factory.Faker("date_of_birth", minimum_age=18, maximum_age=100)
    preferred_language = settings.LANGUAGES[0][0]

    @classmethod
    def create_superuser(cls, **kwargs: Any) -> User:
        return cls.create(is_superuser=True, is_staff=True, **kwargs)

    @classmethod
    def create_staff_user(cls, **kwargs: Any) -> User:
        # User considered staff user if they have any role
        return cls.create_with_general_permissions(**kwargs)

    @classmethod
    def create_with_general_permissions(cls, *, perms: Iterable[str] = (), **kwargs: Any) -> User:
        diff = set(perms).difference(_GENERAL_PERMISSIONS)
        if diff:
            raise RuntimeError(f"Invalid perms: {diff}")

        user = cls.create(**kwargs)

        choice = GeneralRoleChoiceFactory.create(code="admin")
        GeneralRoleFactory.create(role=choice, user=user)
        for perm in perms:
            GeneralRolePermissionFactory.create(role=choice, permission=perm)

        return user

    @classmethod
    def create_with_service_sector_permissions(
        cls,
        service_sector: ServiceSector,
        *,
        perms: Iterable[str] = (),
        **kwargs: Any,
    ) -> User:
        diff = set(perms).difference(_SERVICE_SECTOR_PERMISSIONS)
        if diff:
            raise RuntimeError(f"Invalid perms: {diff}")

        user = cls.create(**kwargs)

        choice = ServiceSectorRoleChoiceFactory.create(code="admin")
        ServiceSectorRoleFactory.create(role=choice, service_sector=service_sector, user=user)
        for perm in perms:
            ServiceSectorRolePermissionFactory.create(role=choice, permission=perm)

        return user

    @classmethod
    def create_with_unit_permissions(cls, unit: Unit, *, perms: Iterable[str] = (), **kwargs: Any) -> User:
        diff = set(perms).difference(_UNIT_PERMISSIONS)
        if diff:
            raise RuntimeError(f"Invalid perms: {diff}")

        user = cls.create(**kwargs)

        choice = UnitRoleChoiceFactory.create(code="admin")
        role = UnitRoleFactory.create(role=choice, user=user)
        role.unit.add(unit)
        for perm in perms:
            UnitRolePermissionFactory.create(role=choice, permission=perm)

        return user

    @classmethod
    def create_with_unit_group_permissions(
        cls,
        unit_group: UnitGroup,
        *,
        perms: Iterable[str] = (),
        **kwargs: Any,
    ) -> User:
        diff = set(perms).difference(_UNIT_PERMISSIONS)
        if diff:
            raise RuntimeError(f"Invalid perms: {diff}")

        user = cls.create(**kwargs)

        choice = UnitRoleChoiceFactory.create(code="admin")
        role = UnitRoleFactory.create(role=choice, user=user)
        role.unit_group.add(unit_group)
        for perm in perms:
            UnitRolePermissionFactory.create(role=choice, permission=perm)

        return user
