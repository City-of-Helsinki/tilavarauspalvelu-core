import contextlib
import re
from datetime import date
from typing import Any, TypedDict, Unpack

from django.core.handlers.wsgi import WSGIRequest
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
from social_django.models import DjangoStorage, UserSocialAuth
from social_django.strategy import DjangoStrategy

from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import IDToken
from users.models import User
from utils.sentry import SentryLogger

__all__ = [
    "fetch_additional_info_for_user_from_helsinki_profile",
    "ssn_to_date",
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


ID_PATTERN = re.compile(r"^\d{6}[-+ABCDEFUVWXY]\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]$")
ID_LETTER_TO_CENTURY: dict[str, int] = {
    "A": 2000,
    "B": 2000,
    "C": 2000,
    "D": 2000,
    "E": 2000,
    "F": 2000,
    "-": 1900,
    "U": 1900,
    "V": 1900,
    "W": 1900,
    "X": 1900,
    "Y": 1900,
    "+": 1800,
}


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
    This is needed since during login, the request user is still anonymous.
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
        ssn_data = HelsinkiProfileClient.get_social_security_number(request)

    if ssn_data is None:
        SentryLogger.log_message(f"Helsinki profile: Could not fetch JWT from Tunnistamo for user {user.pk!r}")
        return

    if ssn_data["id"] is None:
        SentryLogger.log_message(f"Helsinki profile: Profile ID not found for user {user.pk!r}")
        return

    user.profile_id = ssn_data["id"]

    if ssn_data["social_security_number"] is None:
        SentryLogger.log_message(f"Helsinki profile: ID number not found for user {user.pk!r}")
        user.save()
        return

    date_of_birth = ssn_to_date(ssn_data["social_security_number"])
    if date_of_birth is None:
        SentryLogger.log_message(
            f"Helsinki profile: ID number received from profile was not of correct format for user {user.pk!r}"
        )
        user.save()
        return

    user.date_of_birth = date_of_birth
    user.save()


def ssn_to_date(id_number: str) -> date | None:
    if ID_PATTERN.fullmatch(id_number) is None:
        return None

    century = ID_LETTER_TO_CENTURY[id_number[6]]
    return date(
        year=century + int(id_number[4:6]),
        month=int(id_number[2:4]),
        day=int(id_number[0:2]),
    )
