from typing import Any

import factory
from factory import fuzzy

from users.helauth.typing import (
    MyProfileData,
    PermanentAddress,
    PermanentForeignAddress,
    ProfileAddress,
    ProfileEdges,
    ProfileEmail,
    ProfileNode,
    ProfilePhone,
    VerifiedPersonalInfo,
)

from ._base import GenericFactory

__all__ = [
    "MyProfileDataFactory",
    "PermanentAddressFactory",
    "PermanentForeignAddressFactory",
    "ProfileAddressFactory",
    "ProfileEmailFactory",
    "ProfilePhoneFactory",
    "VerifiedPersonalInfoFactory",
]


class ProfilePhoneFactory(GenericFactory[ProfilePhone]):
    class Meta:
        model = ProfilePhone

    phone = factory.Faker("email", locale="fi_FI")
    phoneType = fuzzy.FuzzyChoice(choices=["MOBILE", "HOME", "WORK", "OTHER", "NONE"])


class ProfileEmailFactory(GenericFactory[ProfileEmail]):
    class Meta:
        model = ProfileEmail

    email = factory.Faker("email", locale="fi_FI")
    emailType = fuzzy.FuzzyChoice(choices=["PERSONAL", "WORK", "OTHER", "NONE"])


class ProfileAddressFactory(GenericFactory[ProfileAddress]):
    class Meta:
        model = ProfileAddress

    address = factory.Faker("street_address", locale="fi_FI")
    postalCode = factory.Faker("postcode", locale="fi_FI")
    city = factory.Faker("city", locale="fi_FI")
    addressType = fuzzy.FuzzyChoice(choices=["HOME", "WORK", "OTHER", "NONE"])


class PermanentAddressFactory(GenericFactory[PermanentAddress]):
    class Meta:
        model = PermanentAddress

    streetAddress = factory.Faker("street_address", locale="fi_FI")
    postalCode = factory.Faker("postcode", locale="fi_FI")
    postOffice = factory.Faker("city", locale="fi_FI")


class PermanentForeignAddressFactory(GenericFactory[PermanentForeignAddress]):
    class Meta:
        model = PermanentForeignAddress

    streetAddress = factory.Faker("address", locale="fi_FI")
    additionalAddress = factory.Faker("address", locale="fi_FI")
    countryCode = factory.Faker("country_code", locale="fi_FI")


class VerifiedPersonalInfoFactory(GenericFactory[VerifiedPersonalInfo]):
    class Meta:
        model = VerifiedPersonalInfo

    firstName = factory.Faker("first_name", locale="fi_FI")
    lastName = factory.Faker("last_name", locale="fi_FI")
    municipalityOfResidence = "Helsinki"
    municipalityOfResidenceNumber = "091"
    permanentAddress = factory.SubFactory(PermanentAddressFactory)
    permanentForeignAddress = factory.SubFactory(PermanentForeignAddressFactory)


class MyProfileDataFactory(GenericFactory[MyProfileData]):
    class Meta:
        model = MyProfileData

    firstName = factory.Faker("first_name", locale="fi_FI")
    lastName = factory.Faker("last_name", locale="fi_FI")
    nickname = ""
    language = "FINNISH"
    primaryPhone = factory.SubFactory(ProfilePhoneFactory)
    primaryEmail = factory.SubFactory(ProfileEmailFactory)
    primaryAddress = factory.SubFactory(ProfileAddressFactory)
    verifiedPersonalInformation = factory.SubFactory(VerifiedPersonalInfoFactory)

    @factory.post_generation
    def phones(self: MyProfileData, create: bool, nodes: list[ProfilePhone] | None, **kwargs: Any) -> None:
        if nodes:
            self["phones"] = ProfileEdges(edges=[ProfileNode(node=node) for node in nodes])
        elif kwargs:
            self["phones"] = ProfileEdges(edges=[ProfileNode(node=ProfilePhoneFactory.create(**kwargs))])
        elif self["primaryPhone"]:
            self["phones"] = ProfileEdges(edges=[ProfileNode(node=self["primaryPhone"])])
        else:
            self["phones"] = ProfileEdges(edges=[])

    @factory.post_generation
    def emails(self: MyProfileData, create: bool, nodes: list[ProfileEmail] | None, **kwargs: Any) -> None:
        if nodes:
            self["emails"] = ProfileEdges(edges=[ProfileNode(node=node) for node in nodes])
        elif kwargs:
            self["emails"] = ProfileEdges(edges=[ProfileNode(node=ProfileEmailFactory.create(**kwargs))])
        elif self["primaryEmail"]:
            self["emails"] = ProfileEdges(edges=[ProfileNode(node=self["primaryEmail"])])
        else:
            self["emails"] = ProfileEdges(edges=[])

    @factory.post_generation
    def addresses(self: MyProfileData, create: bool, nodes: list[ProfileAddress] | None, **kwargs: Any) -> None:
        if nodes:
            self["addresses"] = ProfileEdges(edges=[ProfileNode(node=node) for node in nodes])
        elif kwargs:
            self["addresses"] = ProfileEdges(edges=[ProfileNode(node=ProfileAddressFactory.create(**kwargs))])
        elif self["primaryAddress"]:
            self["addresses"] = ProfileEdges(edges=[ProfileNode(node=self["primaryAddress"])])
        else:
            self["addresses"] = ProfileEdges(edges=[])

    @classmethod
    def create_basic(cls, **kwargs: Any) -> MyProfileData:
        kwargs.setdefault("firstName", "Example")
        kwargs.setdefault("lastName", "User")
        kwargs.setdefault(
            "primaryEmail",
            ProfileEmailFactory.create(
                email="user@example.com",
                emailType="PERSONAL",
            ),
        )
        kwargs.setdefault(
            "primaryPhone",
            ProfilePhoneFactory.create(
                phone="0123456789",
                phoneType="MOBILE",
            ),
        )
        kwargs.setdefault(
            "primaryAddress",
            ProfileAddressFactory.create(
                address="Example street 1",
                postalCode="00100",
                city="Helsinki",
                addressType="HOME",
            ),
        )
        return super().create(**kwargs)
