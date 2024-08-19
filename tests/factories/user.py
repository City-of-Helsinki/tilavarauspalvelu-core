import base64
import datetime
import json
import uuid
from collections.abc import Iterable
from dataclasses import asdict
from typing import Any, Literal

import factory
from django.conf import settings
from django.utils.crypto import get_random_string
from social_django.models import UserSocialAuth

from permissions.enums import UserRoleChoice
from spaces.models import Unit, UnitGroup
from users.helauth.typing import IDToken
from users.models import User

from ._base import GenericDjangoModelFactory
from .permissions import GeneralRoleFactory, UnitRoleFactory

__all__ = [
    "UserFactory",
    "UserSocialAuthFactory",
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
    def create_with_general_role(cls, *, role: UserRoleChoice = UserRoleChoice.ADMIN, **kwargs: Any) -> User:
        user = cls.create(**kwargs)
        GeneralRoleFactory.create(role=role, user=user)
        return user

    @classmethod
    def create_with_unit_role(
        cls,
        *,
        units: Iterable[Unit] = (),
        unit_groups: Iterable[UnitGroup] = (),
        role: UserRoleChoice = UserRoleChoice.ADMIN,
        **kwargs: Any,
    ) -> User:
        user = cls.create(**kwargs)
        unit_role = UnitRoleFactory.create(role=role, user=user)
        unit_role.units.add(*units)
        unit_role.unit_groups.add(*unit_groups)
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
    provider = "tunnistamo"  # matches `tilavarauspalvelu.auth.ProxyTunnistamoOIDCAuthBackend.name`
    uid = factory.Sequence(lambda n: f"{n}")

    @factory.post_generation
    def extra_data(self: UserSocialAuth, create: bool, extra_data: dict[str, Any] | None, **kwargs: Any) -> None:
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
    loa: Literal["substantial", "low"] = "low",
    ad_groups: Iterable[str] = (),
) -> str:
    return ".".join(
        [
            # Header
            base64.urlsafe_b64encode(
                json.dumps(
                    {
                        "alg": "RS256",
                        "kid": uuid.uuid4().hex,
                    },
                ).encode(),
            ).decode(),
            # Payload
            base64.urlsafe_b64encode(
                json.dumps(
                    asdict(
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
                        )
                    ),
                ).encode(),
            ).decode(),
            # Signature (not real of course)
            get_random_string(100),
        ]
    )
