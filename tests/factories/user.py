import datetime
import json
import uuid
from base64 import urlsafe_b64encode
from collections.abc import Iterable
from typing import Any

import factory
from django.utils.crypto import get_random_string
from social_django.models import UserSocialAuth

from permissions.models import GENERAL_PERMISSIONS, SERVICE_SECTOR_PERMISSIONS, UNIT_PERMISSIONS
from spaces.models import ServiceSector, Unit, UnitGroup
from tilavarauspalvelu.utils.commons import Language
from users.helauth.utils import IDToken
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
    preferred_language = Language.FI.value

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

    @factory.post_generation
    def social_auth(self, create: bool, auths: Iterable[UserSocialAuth] | None, **kwargs: Any) -> None:
        if create and kwargs:
            kwargs["user"] = self
            UserSocialAuthFactory.create(**kwargs)


class UserSocialAuthFactory(GenericDjangoModelFactory[UserSocialAuth]):
    class Meta:
        model = UserSocialAuth

    user = factory.SubFactory(UserFactory)
    provider = "helsinki"
    uid = factory.Sequence(lambda n: f"{n}")

    @factory.post_generation
    def extra_data(self, create: bool, extra_data: dict[str, Any] | None, **kwargs: Any) -> None:
        if not create:
            return
        self.extra_data = extra_data or get_extra_data(self, **kwargs)


def get_extra_data(instance: UserSocialAuth, **kwargs: Any) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "id_token": get_id_token(instance, **kwargs),
        "auth_time": int(datetime.datetime.now().timestamp()),
        "token_type": "bearer",
        "access_token": uuid.uuid4().hex,
        "refresh_token": uuid.uuid4().hex,
    }


def get_id_token(
    instance: UserSocialAuth,
    amr: str = "helsinkiazuread",
    loa: str = "low",
    ad_groups: Iterable[str] = (),
) -> str:
    return ".".join(
        [
            # Header
            urlsafe_b64encode(
                json.dumps(
                    {
                        "alg": "RS256",
                        "kid": uuid.uuid4().hex,
                    },
                ).encode(),
            ).decode(),
            # Payload
            urlsafe_b64encode(
                json.dumps(
                    IDToken(
                        iss="https://tunnistamo.test.hel.ninja/openid",
                        sub=str(instance.user.uuid),
                        aud="tilavaraus-test",
                        exp=int(datetime.datetime.now().timestamp()),
                        iat=int(datetime.datetime.now().timestamp()),
                        auth_time=int(datetime.datetime.now().timestamp()),
                        nonce=get_random_string(64),
                        at_hash=uuid.uuid4().hex,
                        email=instance.user.email,
                        email_verified=True,
                        ad_groups=list(ad_groups),
                        azp="tilavaraus-test",
                        sid=uuid.uuid4().hex,
                        amr=amr,
                        loa=loa,
                    ),
                ).encode(),
            ).decode(),
            # Signature (not real of course)
            get_random_string(100),
        ]
    )
