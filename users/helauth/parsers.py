from __future__ import annotations

from django.conf import settings
from graphene_django_extensions.utils import get_nested

from applications.models import City
from users.helauth.typing import (
    MyProfileData,
    PermanentAddress,
    PermanentForeignAddress,
    ProfileAddress,
    ProfileEmail,
    ProfileForeignAddress,
    ProfileLocalAddress,
    ProfileNode,
    ProfilePhone,
    ReservationPrefillInfo,
    VerifiedPersonalInfo,
)

__all__ = [
    "ReservationPrefillParser",
]


class ReservationPrefillParser:
    def __init__(self, data: MyProfileData) -> None:
        self.data = data

    def parse(self) -> ReservationPrefillInfo:
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

    def get_last_name(self) -> str | None:
        return self.data.get("lastName")

    def get_first_name(self) -> str | None:
        return self.data.get("firstName")

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

    def get_address(self) -> ProfileLocalAddress | ProfileForeignAddress | None:
        address = self._get_address_by_priority()
        if address is not None:
            return address

        address = self._get_permanent_address()
        if address is not None:
            return address

        return self._get_permanent_foreign_address()

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

    def get_user_home_city(self) -> City | None:
        verified_info: VerifiedPersonalInfo | None = self.data.get("verifiedPersonalInformation")
        if verified_info is None:
            return None

        city_str: str | None = verified_info.get("municipalityOfResidence")
        mun_code: str | None = verified_info.get("municipalityOfResidenceNumber")

        if mun_code == settings.PRIMARY_MUNICIPALITY_NUMBER:
            city: City | None = City.objects.filter(municipality_code=mun_code).first()
            if city is not None:
                return city

        if city_str == settings.PRIMARY_MUNICIPALITY_NAME:
            city: City | None = City.objects.filter(name__iexact=city_str).first()
            if city is not None:
                return city

        return City.objects.filter(name__iexact=settings.SECONDARY_MUNICIPALITY_NAME).first()