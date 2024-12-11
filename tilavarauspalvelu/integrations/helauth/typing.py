from __future__ import annotations

from typing import TYPE_CHECKING, Literal, TypedDict

if TYPE_CHECKING:
    import datetime

    from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
    from social_django.models import DjangoStorage, UserSocialAuth
    from social_django.strategy import DjangoStrategy

    from tilavarauspalvelu.enums import LoginMethod
    from tilavarauspalvelu.models import City, User
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "ExtraData",
    "OIDCResponse",
    "PipelineArgs",
    "ProfileForeignAddress",
    "ProfileLocalAddress",
    "ProfileTokenPayload",
    "RefreshResponse",
    "ReservationPrefillInfo",
    "UserDetails",
]


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


_TokenBase = TypedDict("_TokenBase", {"not-before-policy": int})


class TokenResponse(_TokenBase):
    access_token: str
    expires_in: int
    refresh_expires_in: int
    refresh_token: str
    token_type: bool
    upgraded: bool


class RefreshResponse(_TokenBase):
    access_token: str
    expires_in: int
    id_token: str
    refresh_expires_in: int
    refresh_token: str
    scope: str
    session_state: str
    token_type: str


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


# Profile raw response


class ProfileNode[T](TypedDict):
    node: T


class ProfileEdges[T](TypedDict):
    edges: list[ProfileNode[T]]


# Note `total=False`. This means that the responses could be missing any of the fields!


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
    nationalIdentificationNumber: str | None
    municipalityOfResidence: str | None
    municipalityOfResidenceNumber: str | None
    permanentAddress: PermanentAddress | None
    permanentForeignAddress: PermanentForeignAddress | None


class ProfileData(TypedDict, total=False):
    id: str | None  # random string
    firstName: str | None
    lastName: str | None
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


class BirthdayInfo(TypedDict):
    id: str | None  # random string
    birthday: datetime.date | None


class UserProfileInfo(TypedDict):
    pk: int
    first_name: str | None
    last_name: str | None
    email: str | None
    phone: str | None
    birthday: datetime.date | None
    ssn: str | None
    street_address: str | None
    postal_code: str | None
    city: str | None
    municipality_code: str | None
    municipality_name: str | None
    login_method: LoginMethod
    is_strong_login: bool


# Pipeline


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


class PipelineArgs(TypedDict):
    backend: TunnistamoOIDCAuth
    """OAuth2 backend"""

    request: WSGIRequest
    """Login request"""

    response: OIDCResponse
    """Response from Helsinki Tunnistus"""

    user: User | None
    """User instance to log in"""

    details: UserDetails
    """User details from Helsinki Tunnistus"""

    pipeline_index: int
    """Index of the current pipeline step"""

    social: UserSocialAuth
    """Social auth instance used"""

    storage: DjangoStorage
    """Login storage handler"""

    strategy: DjangoStrategy
    """Login strategy used"""

    uid: str
    """User UUID related to Helsinki Tunnistus"""

    username: str
    """Username of the used that should be logged in"""

    redirect_name: str
    """Path to redirect to after login"""

    is_new: bool
    """Whether the user is new."""

    new_association: bool
    """Whether the user to social auth link is new."""
