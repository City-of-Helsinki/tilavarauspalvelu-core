import base64
import datetime
import json
from collections.abc import Iterable
from dataclasses import asdict
from typing import Any, Literal
from uuid import uuid4  # noqa: ICN003

import factory
from django.conf import settings
from django.utils.crypto import get_random_string
from factory import LazyAttribute, LazyFunction
from social_django.models import UserSocialAuth

from tilavarauspalvelu.enums import ReservationNotification, UserRoleChoice
from tilavarauspalvelu.models import Unit, UnitGroup, User
from tilavarauspalvelu.utils.helauth.typing import IDToken
from utils.date_utils import local_datetime

from ._base import FakerFI, ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "UserFactory",
    "UserSocialAuthFactory",
]


class UserFactory(GenericDjangoModelFactory[User]):
    class Meta:
        model = User
        django_get_or_create = ["first_name", "last_name"]

    # From Django
    first_name = FakerFI("first_name", unique=True)
    last_name = FakerFI("last_name", unique=True)
    username = LazyAttribute(lambda i: f"{i.first_name.lower()}_{i.last_name.lower()}")
    email = LazyAttribute(lambda i: f"{i.first_name.lower()}.{i.last_name.lower()}@example.com")
    is_staff = False
    is_active = True
    is_superuser = False
    date_joined = LazyFunction(local_datetime)
    last_login = LazyFunction(local_datetime)

    # From 'helusers'
    uuid = LazyFunction(uuid4)
    department_name = None  # str

    social_auth = ReverseForeignKeyFactory("tests.factories.user.UserSocialAuthFactory")

    # From our model
    tvp_uuid = LazyFunction(uuid4)
    preferred_language = settings.LANGUAGE_CODE
    date_of_birth = FakerFI("date_of_birth", minimum_age=18, maximum_age=100)
    profile_id = ""

    reservation_notification = ReservationNotification.ONLY_HANDLING_REQUIRED
    sent_email_about_deactivating_permissions = False
    sent_email_about_anonymization = False

    reservations = ReverseForeignKeyFactory("tests.factories.ReservationFactory")
    recurring_reservations = ReverseForeignKeyFactory("tests.factories.RecurringReservationFactory")
    applications = ReverseForeignKeyFactory("tests.factories.ApplicationFactory")
    general_roles = ReverseForeignKeyFactory("tests.factories.GeneralRoleFactory")
    assigned_general_roles = ReverseForeignKeyFactory("tests.factories.GeneralRoleFactory")
    unit_roles = ReverseForeignKeyFactory("tests.factories.UnitRoleFactory")
    assigned_unit_roles = ReverseForeignKeyFactory("tests.factories.UnitRoleFactory")
    introductions = ReverseForeignKeyFactory("tests.factories.IntroductionFactory")

    @classmethod
    def create_superuser(cls, **kwargs: Any) -> User:
        kwargs["is_superuser"] = True
        kwargs["is_staff"] = True
        return cls.create(**kwargs)

    @classmethod
    def create_with_general_role(cls, *, role: UserRoleChoice = UserRoleChoice.ADMIN, **kwargs: Any) -> User:
        kwargs["general_roles__role"] = role
        return cls.create(**kwargs)

    @classmethod
    def create_with_unit_role(
        cls,
        *,
        units: Iterable[Unit] = (),
        unit_groups: Iterable[UnitGroup] = (),
        role: UserRoleChoice = UserRoleChoice.ADMIN,
        **kwargs: Any,
    ) -> User:
        kwargs["unit_roles__role"] = role
        kwargs["unit_roles__units"] = list(units)
        kwargs["unit_roles__unit_groups"] = list(unit_groups)
        return cls.create(**kwargs)


class UserSocialAuthFactory(GenericDjangoModelFactory[UserSocialAuth]):
    class Meta:
        model = UserSocialAuth

    user = ForeignKeyFactory(UserFactory)
    provider = "tunnistamo"  # matches `config.auth.ProxyTunnistamoOIDCAuthBackend.name`
    uid = factory.Sequence(lambda n: f"{n}")

    @factory.post_generation
    def extra_data(self: UserSocialAuth, create: bool, extra_data: dict[str, Any] | None, **kwargs: Any) -> None:
        if not create:
            return
        self.extra_data = extra_data or get_extra_data(self, **kwargs)


def get_extra_data(instance: UserSocialAuth, **kwargs: Any) -> dict[str, Any]:
    return {
        "id": str(uuid4()),
        "id_token": get_id_token(instance, **kwargs),
        "auth_time": int(datetime.datetime.now().timestamp()),
        "token_type": "bearer",
        "access_token": uuid4().hex,
        "refresh_token": uuid4().hex,
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
                        "kid": uuid4().hex,
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
                            jti=uuid4().hex,
                            typ="ID",
                            exp=int(datetime.datetime.now().timestamp()),
                            iat=int(datetime.datetime.now().timestamp()),
                            auth_time=int(datetime.datetime.now().timestamp()),
                            nonce=get_random_string(64),
                            at_hash=uuid4().hex,
                            name=instance.user.username,
                            preferred_username=uuid4().hex,
                            given_name=instance.user.first_name,
                            family_name=instance.user.last_name,
                            email=instance.user.email,
                            email_verified=True,
                            ad_groups=list(ad_groups),
                            azp="tilavaraus-test",
                            sid=uuid4().hex,
                            session_state=uuid4().hex,
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
