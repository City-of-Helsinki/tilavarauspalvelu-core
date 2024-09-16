from __future__ import annotations

import enum
from dataclasses import dataclass
from typing import TYPE_CHECKING, Literal, TypedDict

if TYPE_CHECKING:
    import datetime

    from applications.models import City


__all__ = [
    "ADLoginAMR",
    "ExtraData",
    "IDToken",
    "LoginMethod",
    "ProfileForeignAddress",
    "ProfileLocalAddress",
    "ProfileLoginAMR",
    "ProfileTokenPayload",
    "RefreshResponse",
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
    jti: str
    """JWT ID: uuid"""
    typ: Literal["ID"]
    """token type: ID"""
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
    name: str
    """user name"""
    preferred_username: str
    """user preferred username"""
    given_name: str
    """user given name"""
    family_name: str
    """user family name"""
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
    session_state: str
    """session state: uuid"""
    amr: str | list[str]
    """
    authentication methods reference:
    suomi_fi | heltunnistussuomifi | helsinki_adfs | helsinkiad | helsinkiazuread | eduad
    """
    loa: Literal["substantial", "low"]
    """level of authentication"""

    @classmethod
    def from_string(cls, token: str) -> IDToken | None:
        from users.helauth.utils import get_jwt_payload

        try:
            payload = get_jwt_payload(token)
        except Exception:
            return None

        return cls(
            iss=payload["iss"],
            sub=payload["sub"],
            aud=payload["aud"],
            jti=payload["jti"],
            typ=payload.get("typ", ""),  # type: ignore[arg-type]
            exp=payload["exp"],
            iat=payload["iat"],
            auth_time=payload["auth_time"],
            nonce=payload.get("nonce", ""),
            at_hash=payload.get("at_hash", ""),
            name=payload.get("name", ""),
            preferred_username=payload.get("preferred_username", ""),
            given_name=payload.get("given_name", ""),
            family_name=payload.get("family_name", ""),
            email=payload.get("email", ""),
            email_verified=payload.get("email_verified", False),
            ad_groups=payload.get("ad_groups", []),
            azp=payload.get("azp", ""),
            sid=payload.get("sid", ""),
            session_state=payload.get("session_state", ""),
            amr=payload["amr"],
            loa=payload["loa"],
        )

    @property
    def is_ad_login(self) -> bool:
        amr = self.amr
        if amr is None:
            return False

        if isinstance(amr, str):
            amr = [amr]
        return any(method.value in amr for method in ADLoginAMR)

    @property
    def is_profile_login(self) -> bool:
        amr = self.amr
        if amr is None:
            return False

        if isinstance(amr, str):
            amr = [amr]
        return any(method.value in amr for method in ProfileLoginAMR)

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


class ADLoginAMR(enum.Enum):
    HELSINKI_ADFS = "helsinki_adfs"
    HELSINKIAD = "helsinkiad"
    HELSINKIAZUREAD = "helsinkiazuread"
    EDUAD = "eduad"


class ProfileLoginAMR(enum.Enum):
    SUOMI_FI = "suomi_fi"
    HELTUNNISTUSSUOMIFI = "heltunnistussuomifi"


class LoginMethod(enum.Enum):
    PROFILE = "PROFILE"
    AD = "AD"
    OTHER = "OTHER"


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
