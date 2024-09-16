import contextlib
from typing import Any, TypedDict, Unpack

from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
from social_django.models import DjangoStorage, UserSocialAuth
from social_django.strategy import DjangoStrategy

from common.typing import WSGIRequest
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import IDToken
from users.models import User
from utils.sentry import SentryLogger

__all__ = [
    "fetch_additional_info_for_user_from_helsinki_profile",
    "update_user_from_profile",
]


class UserDetails(TypedDict):
    email: str
    first_name: str | None
    last_name: str | None
    fullname: str | None
    username: str | None


class OIDCResponse(TypedDict):
    access_token: str
    email: str
    email_verified: bool
    expires_in: int
    id_token: str
    nickname: str
    refresh_token: str
    sub: str
    token_type: str


class ExtraKwargs(TypedDict):
    details: UserDetails
    is_new: bool
    new_association: bool
    pipeline_index: int
    social: UserSocialAuth
    storage: DjangoStorage
    strategy: DjangoStrategy
    uid: str
    username: str


def fetch_additional_info_for_user_from_helsinki_profile(
    backend: TunnistamoOIDCAuth,
    request: WSGIRequest,
    response: OIDCResponse,
    user: User | None = None,
    **kwargs: Unpack[ExtraKwargs],
) -> dict[str, Any]:
    if user is None:
        return {"user": user}

    id_token = IDToken.from_string(response["id_token"])
    if id_token is not None and not id_token.is_ad_login and user.profile_id == "":
        update_user_from_profile(request, user=user)

    return {"user": user}


@contextlib.contextmanager
def use_request_user(*, request: WSGIRequest, user: User):
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


@SentryLogger.log_if_raises("Helsinki profile: Failed to update user from profile")
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


def migrate_user_from_tunnistamo_to_keycloak(
    backend: TunnistamoOIDCAuth,
    request: WSGIRequest,
    response: OIDCResponse,
    user: User | None = None,
    **kwargs: Unpack[ExtraKwargs],
) -> dict[str, Any]:
    if user is None:
        return {"user": user}

    id_token = IDToken.from_string(response["id_token"])
    if (
        id_token is not None  # There is an id token.
        and id_token.iss.endswith("helsinki-tunnistus")  # Issuer is keycloak.
        and id_token.is_ad_login  # It is an AD login.
        and id_token.email not in ("", None)  # User has an email.
    ):
        migrate_from_tunnistamo_to_keycloak(email=id_token.email)

    return {"user": user}


@SentryLogger.log_if_raises("Keycloak migration: Failed to migrate user from tunnistamo to keycloak")
def migrate_from_tunnistamo_to_keycloak(*, email: str) -> None:
    # Look at the two most recent AD users with the same email address (no profile ID).
    # There can be more, but the most recent one is the new Keycloak user and the other one
    # is the old Tunnistamo user after the auth-migration (when auth moved to backend), which we want to migrate.
    users: list[User] = list(User.objects.filter(email=email, profile_id="").order_by("date_joined")[:2])
    if len(users) < 2:
        return

    old_user = users[0]
    new_user = users[1]

    # Don't run migration more than once.
    if not old_user.is_active:
        return

    # Migrate staff and superuser status.
    new_user.is_staff = old_user.is_staff
    new_user.is_superuser = old_user.is_superuser
    new_user.save()

    from applications.models import Application
    from permissions.models import GeneralRole, UnitRole
    from reservations.models import RecurringReservation, Reservation

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
    old_user.save()
