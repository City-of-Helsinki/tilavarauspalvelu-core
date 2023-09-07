import re
from datetime import date
from typing import Any, Optional, TypedDict

import requests
from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
from sentry_sdk import capture_exception, capture_message
from social_django.models import DjangoStorage, UserSocialAuth
from social_django.strategy import DjangoStrategy

from common.utils import get_nested

from ..models import User

__all__ = [
    "exchange_oidc_token_for_jwt",
    "fetch_additional_info_for_user_from_helsinki_profile",
    "id_number_to_date",
    "update_user_from_profile",
]


class UserDetails(TypedDict):
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    fullname: Optional[str]
    username: Optional[str]


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
    is_new: bool
    new_association: bool
    pipeline_index: int
    request: WSGIRequest
    response: OIDCResponse
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
    backend: TunnistamoOIDCAuth,  # NOSONAR
    details: UserDetails,  # NOSONAR
    user: Optional[User] = None,
    *args: Any,  # NOSONAR
    **kwargs: Any,  # NOSONAR
) -> dict[str, Any]:
    kwargs: ExtraKwargs  # NOSONAR
    if not user.profile_id:
        oidc_access_token = f"{kwargs['response']['token_type']} {kwargs['response']['access_token']}"
        try:
            update_user_from_profile(user, oidc_access_token)
        except Exception as error:
            capture_exception(error)

    return {"user": user}


def update_user_from_profile(user: User, oidc_access_token: str) -> None:
    jwt_token = exchange_oidc_token_for_jwt(oidc_access_token)
    if jwt_token is None:
        capture_message(f"Could not fetch JWT from Tunnistamo for user {user.pk!r}")
        return

    query = """
        query {
            myProfile {
                id
                verifiedPersonalInformation {
                    nationalIdentificationNumber
                }
            }
        }
    """
    response = requests.get(
        settings.OPEN_CITY_PROFILE_GRAPHQL_API,
        json={"query": query},
        headers={"Authorization": f"Bearer {jwt_token}"},
        timeout=5,
    )
    data = response.json()
    if "errors" in data:
        msg = data["errors"][0]["message"]
        capture_message(msg)
        return

    profile_id: str | None = get_nested(data, "data", "myProfile", "id")
    if profile_id is None:
        capture_message(f"Profile ID not found for user {user.pk!r}")
        return

    user.profile_id = profile_id

    id_number: str | None = get_nested(
        data,
        "data",
        "myProfile",
        "verifiedPersonalInformation",
        "nationalIdentificationNumber",
    )
    if id_number is None:
        capture_message(f"ID number not found for user {user.pk!r}")
        user.save()
        return

    date_of_birth = id_number_to_date(id_number)
    if date_of_birth is None:
        capture_message(f"ID number received from profile was not of correct format for user {user.pk!r}")
        user.save()
        return

    user.date_of_birth = date_of_birth
    user.save()


def id_number_to_date(id_number: str) -> Optional[date]:
    if ID_PATTERN.fullmatch(id_number) is None:
        return None

    century = ID_LETTER_TO_CENTURY[id_number[6]]
    return date(
        year=century + int(id_number[4:6]),
        month=int(id_number[2:4]),
        day=int(id_number[0:2]),
    )


def exchange_oidc_token_for_jwt(oidc_access_token: str) -> Optional[str]:
    response = requests.get(
        url=settings.TUNNISTAMO_ACCESS_TOKEN_ENDPOINT,
        headers={"Authorization": oidc_access_token},
        timeout=5,
    )
    data = response.json()
    return data.get(settings.OPEN_CITY_PROFILE_SCOPE)
