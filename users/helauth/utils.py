from __future__ import annotations

import datetime
import enum
import json
import logging
import time
from base64 import urlsafe_b64decode
from typing import TYPE_CHECKING, Any, Literal, TypedDict

import requests
from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from requests.exceptions import HTTPError
from social_django.models import DjangoStorage, UserSocialAuth
from social_django.strategy import DjangoStrategy

from tilavarauspalvelu.auth import ProxyTunnistamoOIDCAuthBackend

if TYPE_CHECKING:
    from common.typing import AnyUser
    from users.models import User


__all__ = [
    "ensure_profile_token_valid",
    "get_id_token",
    "get_jwt_payload",
    "get_profile_token",
    "get_tunnistamo_token",
    "get_user_social_auth",
    "is_ad_login",
    "is_strong_login",
    "refresh_profile_token",
    "refresh_tunnistamo_token",
]


logger = logging.getLogger(__name__)

LEEWAY_SECONDS = 60


class IDToken(TypedDict):
    iss: str
    """token issuer: tunnistamo url"""
    sub: str
    """token subject: uuid"""
    aud: str
    """token audience: tilavaraus-{env}"""
    exp: int
    """token expiration date: unix epoch timestamp"""
    iat: int
    """token issued-at: unix epoch timestamp"""
    auth_time: int
    """when end-user auth occurred: unix epoch timestamp"""
    nonce: str
    """random string"""
    at_hash: str
    """access token hash: sha256"""
    email: str
    """user email"""
    email_verified: bool
    """Whether the is email verified or not"""
    ad_groups: list[str]
    """list of ad groups the user belongs to"""
    azp: str
    """authorized party: tilavaraus-{env}"""
    sid: str
    """session id: uuid"""
    amr: str | list[str]
    """
    authentication methods reference:
    suomi_fi | heltunnistussuomifi | helsinki_adfs | helsinkiad | helsinkiazuread
    """
    loa: str
    """level of authentication: substantial | low"""


class ExtraData(TypedDict):
    id: str
    """User's uuid: uuid"""
    id_token: str
    """IDToken as a JWT: str"""
    auth_time: int
    """When the user authenticated: unix epoch timestamp"""
    token_type: str
    """Token type: bearer"""
    access_token: str
    """Access token: str"""
    refresh_token: str
    """Refresh token: str"""


class SessionData(TypedDict):
    # Added by helauth & social_auth. See: 'helusers.pipeline.fetch_api_tokens'.
    access_token: str  # random token
    access_token_expires_at: datetime.datetime
    access_token_expires_at_ts: int  # timestamp
    access_token_scope: list[str]
    api_tokens: dict[str, str]  # scope -> token -mapping
    social_auth_end_session_url: str  # url
    social_auth_id_token: str  # id token in jwt format
    social_auth_last_login_backend: str  # 'tunnistamo'
    tunnistamo_state: str  # random string

    # Some django variables.
    next: str  # redirect url
    _auth_user_backend: str  # dot import string
    _auth_user_hash: str  # hash
    _auth_user_id: str  # user id


class RefreshResponse(TypedDict):
    access_token: str
    refresh_token: str
    token_type: str  # 'bearer'
    expires_in: int
    id_token: str  # IDToken as JWT


def get_user_social_auth(user: User) -> UserSocialAuth | None:
    # After login in once, the user will have a UserSocialAuth entry created for it.
    # This entry is updated when the user logs in again, so we can use it to get the
    # latest login information. If the user has multiple entries (for some reason),
    # we use the latest modified one.
    return user.social_auth.order_by("-modified").first()


def get_session_data(request: WSGIRequest) -> SessionData:
    # Session is actually a `django.contrib.sessions.backends.base.SessionBase`
    # subclass, but for typing convenience, we hint it as a dict.
    # Session middleware takes care of updating the session cache/cookie when
    # the session data is modified.
    return request.session  # type: ignore[return-value]


def get_id_token(user: AnyUser) -> IDToken | None:
    if user.is_anonymous:
        return None

    social_auth = get_user_social_auth(user)
    if social_auth is None:
        msg = f"Unable to get `social_auth` for user {user.pk}."
        logger.error(msg)
        return None

    extra_data: ExtraData = social_auth.extra_data
    return get_jwt_payload(extra_data["id_token"])


def get_tunnistamo_token(request: WSGIRequest) -> str | None:
    session_data = get_session_data(request)

    # Check if the token will expire within the leeway, and refresh it if needed.
    leeway = datetime.timedelta(seconds=LEEWAY_SECONDS)
    is_token_valid = session_data["access_token_expires_at"] > datetime.datetime.now() - leeway
    if is_token_valid:
        return session_data["access_token"]

    return refresh_tunnistamo_token(request)


def refresh_tunnistamo_token(request: WSGIRequest) -> str | None:
    social_auth = get_user_social_auth(request.user)
    if social_auth is None:
        msg = f"Unable to get `social_auth` for user {request.user.pk}."
        logger.error(msg)
        return None

    extra_data: ExtraData = social_auth.extra_data

    # The strategy/storage doesn't really matter here.
    backend = ProxyTunnistamoOIDCAuthBackend(strategy=DjangoStrategy(storage=DjangoStorage()))

    try:
        response: RefreshResponse = backend.refresh_token(token=extra_data["refresh_token"])
    except HTTPError as error:
        msg = f"Unable to refresh token for user {request.user.pk}: {error.response.content}"
        logger.exception(msg, exc_info=error)
        return None

    expires_at = datetime.datetime.now() + datetime.timedelta(seconds=response["expires_in"])
    expires_at_ts = int(expires_at.timestamp()) * 1000

    session_data = get_session_data(request)
    session_data["access_token"] = response["access_token"]
    session_data["access_token_expires_at"] = expires_at
    session_data["access_token_expires_at_ts"] = expires_at_ts

    extra_data["id_token"] = response["id_token"]
    extra_data["auth_time"] = int(time.time())
    extra_data["token_type"] = response["token_type"]
    extra_data["refresh_token"] = response["refresh_token"]
    extra_data["access_token"] = response["access_token"]
    social_auth.save(update_fields=["extra_data"])

    return response["access_token"]


def ensure_profile_token_valid(request: WSGIRequest) -> None:
    """Ensure that the profile token is valid. If it's not, refresh it."""
    get_profile_token(request)


def get_profile_token(request: WSGIRequest) -> str | None:
    session_data = get_session_data(request)
    token = session_data["api_tokens"].get(settings.OPEN_CITY_PROFILE_SCOPE)

    # Check if the token will expire within the leeway, and refresh it if needed.
    payload = get_jwt_payload(token)
    is_token_valid = payload["exp"] > int(time.time()) + LEEWAY_SECONDS
    if is_token_valid:
        return token

    return refresh_profile_token(request)


def refresh_profile_token(request: WSGIRequest) -> str | None:
    access_token = get_tunnistamo_token(request)
    if access_token is None:
        msg = "Unable to get tunnistamo access token to refresh profile token."
        logger.error(msg)
        return None

    url: str = f"{settings.TUNNISTAMO_BASE_URL}/api-tokens/"
    headers: dict[str, str] = {"Authorization": f"Bearer {access_token}"}
    response = requests.post(url, headers=headers, timeout=10, allow_redirects=True)
    if response.status_code != 200:
        msg = f"Unable to get API tokens for helsinki profile: [{response.status_code}] {response.text}"
        logger.error(msg)
        return None

    session_data = get_session_data(request)
    session_data["api_tokens"] = response.json()
    return session_data["api_tokens"].get(settings.OPEN_CITY_PROFILE_SCOPE)


def get_jwt_payload(json_web_token: str) -> IDToken:
    payload_part: str = json_web_token.split(".")[1]  # Get the payload part of the id token
    payload_part += "=" * divmod(len(payload_part), 4)[1]  # Add padding to the payload if needed
    payload: str = urlsafe_b64decode(payload_part).decode()  # Decode the payload
    return json.loads(payload)  # Return the payload as a dict


class ADLoginAMR(enum.Enum):
    HELSINKI_ADFS = "helsinki_adfs"
    HELSINKIAD = "helsinkiad"
    HELSINKIAZUREAD = "helsinkiazuread"


def is_ad_login(token: IDToken | dict[str, Any]) -> bool:
    amr: str | list[str] | None = token.get("amr")
    if amr is None:
        return False

    if isinstance(amr, str):
        amr = [amr]
    return any(method.value in amr for method in ADLoginAMR)


def is_strong_login(token: IDToken | dict[str, Any]) -> bool:
    loa: Literal["substantial", "low"] | None = token.get("loa")
    return loa == "substantial"
