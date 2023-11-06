import re
from datetime import date
from typing import Any, TypedDict

import requests
from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
from sentry_sdk import capture_exception, capture_message
from social_django.models import DjangoStorage, UserSocialAuth
from social_django.strategy import DjangoStrategy

from common.utils import get_nested
from users.helauth.utils import get_profile_token, is_ad_login
from users.models import User

__all__ = [
    "fetch_additional_info_for_user_from_helsinki_profile",
    "id_number_to_date",
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
    backend: TunnistamoOIDCAuth,
    request: WSGIRequest,
    user: User | None = None,
    **kwargs: Any,  # NOSONAR
) -> dict[str, Any]:
    kwargs: ExtraKwargs  # NOSONAR
    id_token = backend.id_token or {}
    if not is_ad_login(id_token) and user.profile_id == "":
        token = get_profile_token(request.session)
        try:
            update_user_from_profile(user, token)
        except Exception as error:
            capture_exception(error)

    return {"user": user}


def update_user_from_profile(user: User, token: str | None) -> None:
    if token is None:
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
        headers={"Authorization": f"Bearer {token}"},
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


def id_number_to_date(id_number: str) -> date | None:
    if ID_PATTERN.fullmatch(id_number) is None:
        return None

    century = ID_LETTER_TO_CENTURY[id_number[6]]
    return date(
        year=century + int(id_number[4:6]),
        month=int(id_number[2:4]),
        day=int(id_number[0:2]),
    )
