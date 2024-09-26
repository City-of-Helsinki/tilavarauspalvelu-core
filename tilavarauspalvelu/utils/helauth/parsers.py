from __future__ import annotations

import datetime
import re
from typing import TYPE_CHECKING

from django.conf import settings
from graphene_django_extensions.utils import get_nested

from applications.models import City
from tilavarauspalvelu.utils.helauth.typing import (
    BirthdayInfo,
    LoginMethod,
    PermanentAddress,
    PermanentForeignAddress,
    ProfileAddress,
    ProfileData,
    ProfileEmail,
    ProfileForeignAddress,
    ProfileLocalAddress,
    ProfileNode,
    ProfilePhone,
    ReservationPrefillInfo,
    UserProfileInfo,
    VerifiedPersonalInfo,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User

__all__ = [
    "ProfileDataParser",
]


class ProfileDataParser:
    def __init__(self, data: ProfileData) -> None:
        self.data = data

    def parse_reservation_prefill_data(self) -> ReservationPrefillInfo:
        address = self.get_address() or {}
        return ReservationPrefillInfo(
            reservee_first_name=self.get_first_name(),
            reservee_last_name=self.get_last_name(),
            reservee_email=self.get_email(),
            reservee_phone=self.get_phone(),
            reservee_address_street=address.get("address"),
            reservee_address_zip=address.get("postalCode"),
            reservee_address_city=address.get("city"),
            home_city=self.get_user_home_city(),
        )

    def parse_birthday_info(self) -> BirthdayInfo:
        return BirthdayInfo(
            id=self.data.get("id"),
            birthday=self.get_birthday(),
        )

    def parse_user_profile_info(self, *, user: User) -> UserProfileInfo:
        address = self.get_address(prefer_verified=True)
        return UserProfileInfo(
            pk=user.pk,
            first_name=self.get_first_name(prefer_verified=True),
            last_name=self.get_last_name(prefer_verified=True),
            email=self.get_email(),
            phone=self.get_phone(),
            birthday=self.get_birthday(),
            ssn=self.get_social_security_number(),
            street_address=address.get("address"),
            postal_code=address.get("postalCode"),
            city=address.get("city"),
            municipality_code=self.get_municipality_code(),
            municipality_name=self.get_municipality_name(),
            login_method=LoginMethod.PROFILE,
            is_strong_login=self.is_strong_login(),
        )

    def get_first_name(self, *, prefer_verified: bool = False) -> str | None:
        first_name = self.data.get("firstName")
        verified_first_name = get_nested(self.data, "verifiedPersonalInformation", "firstName")
        return verified_first_name or first_name if prefer_verified else first_name or verified_first_name

    def get_last_name(self, *, prefer_verified: bool = False) -> str | None:
        last_name = self.data.get("lastName")
        verified_last_name = get_nested(self.data, "verifiedPersonalInformation", "lastName")
        return verified_last_name or last_name if prefer_verified else last_name or verified_last_name

    def get_email(self) -> str | None:
        primary_email: ProfileEmail | None = self.data.get("primaryEmail")
        if primary_email is not None:
            return primary_email.get("email")

        emails: list[ProfileNode[ProfileEmail]] = get_nested(self.data, "emails", "edges", default=[])

        type_priorities = ["PERSONAL", "WORK", "OTHER", "NONE"]

        for email_type in type_priorities:
            for email in emails:
                if get_nested(email, "node", "emailType") == email_type:
                    return get_nested(email, "node", "email")
        return None

    def get_phone(self) -> str | None:
        primary_phone: ProfilePhone | None = self.data.get("primaryPhone")
        if primary_phone is not None:
            return primary_phone.get("phone")

        phones: list[ProfileNode[ProfilePhone]] = get_nested(self.data, "phones", "edges", default=[])

        type_priorities = ["MOBILE", "HOME", "WORK", "OTHER", "NONE"]

        for phone_type in type_priorities:
            for phone in phones:
                if get_nested(phone, "node", "phoneType") == phone_type:
                    return get_nested(phone, "node", "phone")

        return None

    def get_address(self, *, prefer_verified: bool = False) -> ProfileLocalAddress | ProfileForeignAddress | None:
        address = self._get_address_by_priority()
        permanent_address = self._get_permanent_address()
        permanent_foreign_address = self._get_permanent_foreign_address()

        return (
            permanent_address or permanent_foreign_address or address
            if prefer_verified
            else address or permanent_address or permanent_foreign_address
        )

    def _get_address_by_priority(self) -> ProfileLocalAddress | None:
        primary_address: ProfileAddress | None = self.data.get("primaryAddress")
        if primary_address is not None:
            return ProfileLocalAddress(
                address=primary_address.get("address"),
                postalCode=primary_address.get("postalCode"),
                city=primary_address.get("city"),
            )

        addresses: list[ProfileNode[ProfileAddress]] = get_nested(self.data, "addresses", "edges", default=[])

        type_priorities = ["HOME", "WORK", "OTHER", "NONE"]

        for address_type in type_priorities:
            for address in addresses:
                if get_nested(address, "node", "addressType") == address_type:
                    return ProfileLocalAddress(
                        address=get_nested(address, "node", "address"),
                        postalCode=get_nested(address, "node", "postalCode"),
                        city=get_nested(address, "node", "city"),
                    )
        return None

    def _get_permanent_address(self) -> ProfileLocalAddress | None:
        address: PermanentAddress | None = get_nested(
            self.data,
            "verifiedPersonalInformation",
            "permanentAddress",
        )

        if address is not None:
            return ProfileLocalAddress(
                address=address.get("streetAddress"),
                postalCode=address.get("postalCode"),
                city=address.get("postOffice"),
            )

        return None

    def _get_permanent_foreign_address(self) -> ProfileForeignAddress | None:
        address: PermanentForeignAddress | None = get_nested(
            self.data,
            "verifiedPersonalInformation",
            "permanentForeignAddress",
        )

        if address is not None:
            return ProfileForeignAddress(
                address=address.get("streetAddress"),
                countryCode=address.get("countryCode"),
            )

        return None

    def get_municipality_name(self) -> str | None:
        verified_info: VerifiedPersonalInfo | None = self.data.get("verifiedPersonalInformation")
        if verified_info is None:
            return None

        return verified_info.get("municipalityOfResidence")

    def get_municipality_code(self) -> str | None:
        verified_info: VerifiedPersonalInfo | None = self.data.get("verifiedPersonalInformation")
        if verified_info is None:
            return None

        return verified_info.get("municipalityOfResidenceNumber")

    def get_user_home_city(self) -> City | None:
        verified_info: VerifiedPersonalInfo | None = self.data.get("verifiedPersonalInformation")
        if verified_info is None:
            return None

        municipality_code = self.get_municipality_code()

        if municipality_code == settings.PRIMARY_MUNICIPALITY_NUMBER:
            city: City | None = City.objects.filter(municipality_code=municipality_code).first()
            if city is not None:
                return city

        municipality_name = self.get_municipality_name()

        if municipality_name == settings.PRIMARY_MUNICIPALITY_NAME:
            city: City | None = City.objects.filter(name__iexact=municipality_name).first()
            if city is not None:
                return city

        return City.objects.filter(name__iexact=settings.SECONDARY_MUNICIPALITY_NAME).first()

    def get_social_security_number(self) -> str | None:
        return get_nested(
            self.data,
            "verifiedPersonalInformation",
            "nationalIdentificationNumber",
        )

    def get_birthday(self) -> datetime.date | None:
        ssn = self.get_social_security_number()
        if ssn is None:
            return None
        return ssn_to_date(ssn)

    def is_strong_login(self) -> bool:
        return self.data.get("verifiedPersonalInformation") is not None


def ssn_to_date(id_number: str) -> datetime.date | None:
    if ID_PATTERN.fullmatch(id_number) is None:
        return None

    century = ID_LETTER_TO_CENTURY[id_number[6]]
    return datetime.date(
        year=century + int(id_number[4:6]),
        month=int(id_number[2:4]),
        day=int(id_number[0:2]),
    )


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
