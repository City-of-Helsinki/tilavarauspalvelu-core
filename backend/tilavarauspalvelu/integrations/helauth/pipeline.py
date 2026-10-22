from __future__ import annotations

import contextlib
from typing import TYPE_CHECKING, Any, Unpack

from django.db import models
from django.db.models.functions import Concat

from tilavarauspalvelu.dataclasses import IDToken
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import ReservationPrefillInfo
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Application, GeneralRole, Reservation, ReservationSeries, UnitRole, User

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import WSGIRequest

    from .typing import PipelineArgs

__all__ = [
    "migrate_from_tunnistamo_to_keycloak",
    "update_user_from_profile",
]


def store_end_session_url(**kwargs: Unpack[PipelineArgs]) -> None:
    """Copy of 'helusers.pipeline.store_end_session_url' that reads the request from the strategy."""
    user = kwargs["user"]
    backend = kwargs["backend"]
    response = kwargs["response"]
    request = kwargs["strategy"].request

    if user is None or not user.is_authenticated or request is None:
        return

    end_session_url = backend.get_end_session_url(request, response["id_token"])
    if not end_session_url:
        return

    request.session["social_auth_end_session_url"] = end_session_url
    request.session["social_auth_id_token"] = response["id_token"]


def fetch_additional_info_for_user_from_helsinki_profile(**kwargs: Unpack[PipelineArgs]) -> dict[str, Any]:
    user = kwargs["user"]
    response = kwargs["response"]
    request = kwargs["strategy"].request

    if user is None:
        return {"user": user}

    id_token = IDToken.from_string(response["id_token"])
    if id_token is not None and not id_token.is_ad_login:
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
        after_login_additional_info = HelsinkiProfileClient.get_after_login_additional_info(
            user=request.user, session=request.session
        )

    if after_login_additional_info is None:
        SentryLogger.log_message(
            "Helsinki profile: Could not fetch JWT from Tunnistamo.",
            details={"user_id": str(user.pk)},
        )
        return

    # Update the user only if it's missing profile info
    if not user.profile_id or not user.date_of_birth:
        if after_login_additional_info["id"] is not None:
            user.profile_id = after_login_additional_info["id"]
        if after_login_additional_info["birthday"] is not None:
            user.date_of_birth = after_login_additional_info["birthday"]
        user.save()

    # In case the user HelsinkiProfile authentication has expired, the profile info can not be fetched
    # from during the reservation creation. In that case, we need to store the profile info in the session
    # so that it can be used later when creating the reservation.
    # Extract only the prefill info from the response and store it in the session
    request.session["reservation_prefill_info"] = ReservationPrefillInfo(**{
        k: after_login_additional_info[k]  # type: ignore[literal-required]
        for k in list(ReservationPrefillInfo.__annotations__)
    })


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
        migrate_from_tunnistamo_to_keycloak(user=user, email=id_token.email)

    return {"user": user}


@SentryLogger.log_if_raises("Login: Failed to migrate user from tunnistamo to keycloak")
def migrate_from_tunnistamo_to_keycloak(*, user: User, email: str) -> None:
    # The user logging in with Keycloak AD is the new user. The most recent older AD user with the same
    # email address (no profile ID) is the old Tunnistamo user after the auth-migration (when auth moved
    # to backend), which we want to migrate. Newer users with the same email are other accounts.
    older_users = User.objects.filter(
        email__iexact=email,
        profile_id="",
        is_active=True,
        date_joined__lt=user.date_joined,
    )
    old_user = older_users.order_by("-date_joined").first()
    if old_user is None:
        return

    new_user = user

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
    # Migrate reservation series.
    ReservationSeries.objects.filter(user=old_user).update(user=new_user)

    # Mark the old user as inactive.
    old_user.is_active = False
    old_user.last_name += " EXPIRED"
    old_user.save()

    # Also mark additional users older than these two as inactive, so that migration doesn't happen again.
    older_users.update(
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
