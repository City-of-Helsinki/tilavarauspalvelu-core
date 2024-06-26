import contextlib
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
        birthday_info = HelsinkiProfileClient.get_birthday_info(request)

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
