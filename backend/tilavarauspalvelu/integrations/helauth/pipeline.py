from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING, Any, Unpack

from django.db import models
from django.db.models.functions import Concat

from tilavarauspalvelu.dataclasses import IDToken
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Application, GeneralRole, RecurringReservation, Reservation, UnitRole, User

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest

    from .typing import PipelineArgs

__all__ = [
    "migrate_from_tunnistamo_to_keycloak",
    "update_user_from_profile",
]


def fetch_additional_info_for_user_from_helsinki_profile(**kwargs: Unpack[PipelineArgs]) -> dict[str, Any]:
    user = kwargs["user"]
    response = kwargs["response"]
    request = kwargs["request"]

    if user is None:
        return {"user": user}

    id_token = IDToken.from_string(response["id_token"])
    if id_token is not None and not id_token.is_ad_login and not user.profile_id:
        update_user_from_profile(request, user=user)

    return {"user": user}


@contextlib.contextmanager
def use_request_user(request: WSGIRequest, user: User) -> None:
    """
    Use the provided user as the request user for the duration of the context.
    This is needed during login, since the request user is still anonymous.
    """
    original_user = request.user
    try:
        request.user = user
        yield
    finally:
        request.user = original_user


@SentryLogger.log_if_raises("Login: Failed to update user from profile")
def update_user_from_profile(request: WSGIRequest, *, user: User | None = None) -> None:
    user = user or request.user
    if user.is_anonymous:
        return

    with use_request_user(request=request, user=user):
        birthday_info = HelsinkiProfileClient.get_birthday_info(user=request.user, session=request.session)

    if birthday_info is None:
        SentryLogger.log_message(
            "Helsinki profile: Could not fetch JWT from Tunnistamo.",
            details={"user_id": str(user.pk)},
        )
        return

    if birthday_info["id"] is not None:
        user.profile_id = birthday_info["id"]
    if birthday_info["birthday"] is not None:
        user.date_of_birth = birthday_info["birthday"]

    user.save()


def migrate_user_from_tunnistamo_to_keycloak(**kwargs: Unpack[PipelineArgs]) -> dict[str, Any]:
    user = kwargs["user"]
    response = kwargs["response"]

    if user is None:
        return {"user": user}

    id_token = IDToken.from_string(response["id_token"])
    if (
        id_token is not None  # There is an id token.
        and id_token.iss.endswith("helsinki-tunnistus")  # Issuer is keycloak.
        and id_token.is_ad_login  # It is an AD login.
        and id_token.email not in {"", None}  # User has an email.
    ):
        migrate_from_tunnistamo_to_keycloak(email=id_token.email)

    return {"user": user}


@SentryLogger.log_if_raises("Login: Failed to migrate user from tunnistamo to keycloak")
def migrate_from_tunnistamo_to_keycloak(*, email: str) -> None:
    # Look at the two most recent AD users with the same email address (no profile ID).
    # There can be more, but the most recent one is the new Keycloak user and the other one
    # is the old Tunnistamo user after the auth-migration (when auth moved to backend), which we want to migrate.
    users: list[User] = list(
        User.objects.filter(email__iexact=email, profile_id="", is_active=True).order_by("-date_joined")[:2]
    )
    if len(users) < 2:  # noqa: PLR2004
        return

    new_user = users[0]
    old_user = users[1]

    # Migrate user properties.
    new_user.is_staff = old_user.is_staff
    new_user.is_superuser = old_user.is_superuser
    new_user.reservation_notification = old_user.reservation_notification
    new_user.save()

    # Migrate general roles.
    GeneralRole.objects.filter(user=old_user).update(user=new_user)
    # Migrate unit roles.
    UnitRole.objects.filter(user=old_user).update(user=new_user)
    # Migrate applications.
    Application.objects.filter(user=old_user).update(user=new_user)
    # Migrate reservations.
    Reservation.objects.filter(user=old_user).update(user=new_user)
    # Migrate recurring reservations.
    RecurringReservation.objects.filter(user=old_user).update(user=new_user)

    # Mark the old user as inactive.
    old_user.is_active = False
    old_user.last_name += " EXPIRED"
    old_user.save()

    # Also mark additional users older than these two as inactive, so that migration doesn't happen again.
    User.objects.filter(
        email__iexact=email,
        profile_id="",
        is_active=True,
    ).exclude(
        id=new_user.id,
    ).update(
        is_active=False,
        last_name=Concat(models.F("last_name"), models.Value(" EXPIRED")),
    )


def update_roles_from_ad_groups(**kwargs: Unpack[PipelineArgs]) -> dict[str, Any]:
    user = kwargs["user"]

    if user is None:
        return {"user": user}

    try:
        user.actions.update_unit_roles_from_ad_groups()
    except Exception as error:  # noqa: BLE001
        msg = "Login: Failed to update user roles from AD groups"
        SentryLogger.log_exception(error, msg, user_id=user.id)

    return {"user": user}
