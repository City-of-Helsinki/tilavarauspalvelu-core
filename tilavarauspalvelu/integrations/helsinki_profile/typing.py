from __future__ import annotations

from typing import TYPE_CHECKING, Literal, TypedDict

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.enums import LoginMethod
    from tilavarauspalvelu.models import City

# Profile raw response


class ProfileNode[T](TypedDict):
    node: T


class ProfileEdges[T](TypedDict):
    edges: list[ProfileNode[T]]


class ProfilePhone(TypedDict, total=False):
    phone: str | None
    phoneType: Literal["MOBILE", "HOME", "WORK", "OTHER", "NONE"] | None


# Note `total=False`. This means that the responses could be missing any of the fields!


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
