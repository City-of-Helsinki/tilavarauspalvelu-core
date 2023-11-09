import enum
import json
from base64 import urlsafe_b64decode
from typing import Any, TypedDict

from django.conf import settings
from django.contrib.sessions.backends.base import SessionBase
from social_django.models import UserSocialAuth

from common.typing import AnyUser

__all__ = [
    "get_id_token",
    "get_jwt_payload",
    "get_profile_token",
    "is_ad_login",
]


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


def get_id_token(user: AnyUser) -> IDToken | None:
    if user.is_anonymous:
        return None

    # After login in once, the user will have a UserSocialAuth entry created for it.
    # This entry contains a `id_token` with the user's login information.
    # This entry is updated when the user logs in again, so we can use it to get the
    # latest login information. If the user has multiple entries (for some reason),
    # we use the latest modified one.
    social_auth: UserSocialAuth | None = user.social_auth.order_by("-modified").first()
    if social_auth is not None:
        id_token: str | None = social_auth.extra_data.get("id_token", None)
        if id_token is not None:
            return get_jwt_payload(id_token)

    return None


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


def get_profile_token(session: SessionBase) -> str | None:
    # See what 'helusers.pipeline.fetch_api_tokens' adds in the session
    return session.get("api_tokens", {}).get(settings.OPEN_CITY_PROFILE_SCOPE)
