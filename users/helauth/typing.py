from __future__ import annotations

import datetime
import enum
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal, TypedDict

if TYPE_CHECKING:
    from applications.models import City


__all__ = [
    "IDToken",
    "ExtraData",
    "RefreshResponse",
    "ProfileTokenPayload",
    "SessionData",
    "ADLoginAMR",
    "ProfileLocalAddress",
    "ProfileForeignAddress",
    "ReservationPrefillInfo",
]


@dataclass
class IDToken:
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
    loa: Literal["substantial", "low"]
    """level of authentication"""

    @property
    def is_ad_login(self) -> bool:
        amr = self.amr
        if amr is None:
            return False

        if isinstance(amr, str):
            amr = [amr]
        return any(method.value in amr for method in ADLoginAMR)

    @property
    def is_strong_login(self) -> bool:
        return self.loa == "substantial"


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


class RefreshResponse(TypedDict):
    access_token: str
    refresh_token: str
    token_type: str  # 'bearer'
    expires_in: int
    id_token: str  # IDToken as JWT


class ProfileTokenPayload(TypedDict):
    iss: str  # issuer: url
    sub: str  # subject: uuid
    aud: str  # audience: url
    exp: int  # expiration date: unix epoch timestamp
    iat: int  # issued-at: unix epoch timestamp
    auth_time: int  # when end-user auth occurred: unix epoch timestamp
    name: str
    given_name: str
    family_name: str
    nickname: str
    email: str
    email_verified: bool
    ad_groups: list[str]
    azp: str  # authorized party: tilavaraus-{env}
    sid: str  # session id: uuid
    amr: str | list[str]  # authentication methods reference
    loa: str  # level of authentication: substantial | low

    # Additionally, the payload contains a 'scope' key with a list of scopes. E.g.:
    # https://api.hel.fi/auth': ['helsinkiprofile']


class SessionData(TypedDict, total=False):
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


class ADLoginAMR(enum.Enum):
    HELSINKI_ADFS = "helsinki_adfs"
    HELSINKIAD = "helsinkiad"
    HELSINKIAZUREAD = "helsinkiazuread"


# Profile raw response


class ProfileNode[T](TypedDict):
    node: T


class ProfileEdges[T](TypedDict):
    edges: list[ProfileNode[T]]


class ProfilePhone(TypedDict, total=False):
    phone: str | None
    phoneType: Literal["MOBILE", "HOME", "WORK", "OTHER", "NONE"] | None


class ProfileEmail(TypedDict, total=False):
    email: str | None
    emailType: Literal["PERSONAL", "WORK", "OTHER", "NONE"] | None


class ProfileAddress(TypedDict, total=False):
    address: str | None
    postalCode: str | None
    city: str | None
    addressType: Literal["HOME", "WORK", "OTHER", "NONE"] | None


class PermanentAddress(TypedDict, total=False):
    streetAddress: str | None
    postalCode: str | None
    postOffice: str | None


class PermanentForeignAddress(TypedDict, total=False):
    streetAddress: str | None
    additionalAddress: str | None
    countryCode: str | None


class VerifiedPersonalInfo(TypedDict, total=False):
    firstName: str | None
    lastName: str | None
    municipalityOfResidence: str | None
    municipalityOfResidenceNumber: str | None
    permanentAddress: PermanentAddress | None
    permanentForeignAddress: PermanentForeignAddress | None


class MyProfileData(TypedDict, total=False):
    firstName: str | None
    lastName: str | None
    nickname: str | None
    language: str | None
    primaryPhone: ProfilePhone | None
    primaryEmail: ProfileEmail | None
    primaryAddress: ProfileAddress | None
    phones: ProfileEdges[ProfilePhone] | None
    emails: ProfileEdges[ProfileEmail] | None
    addresses: ProfileEdges[ProfileAddress] | None
    verifiedPersonalInformation: VerifiedPersonalInfo | None


# Profile normalized response


class ProfileLocalAddress(TypedDict):
    address: str | None
    postalCode: str | None
    city: str | None


class ProfileForeignAddress(TypedDict):
    address: str | None
    countryCode: str | None


class ReservationPrefillInfo(TypedDict):
    reservee_first_name: str | None
    reservee_last_name: str | None
    reservee_email: str | None
    reservee_phone: str | None
    reservee_address_street: str | None
    reservee_address_zip: str | None
    reservee_address_city: str | None
    home_city: City | None
