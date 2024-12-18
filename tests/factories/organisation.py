from __future__ import annotations

from typing import Any

from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import OrganizationTypeChoice
from tilavarauspalvelu.models import Organisation

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "OrganisationFactory",
]


class OrganisationFactory(GenericDjangoModelFactory[Organisation]):
    class Meta:
        model = Organisation

    name = FakerFI("company")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("company")
    name_sv = FakerSV("company")

    email = FakerFI("email")

    identifier = FakerFI("company_business_id")

    year_established = fuzzy.FuzzyInteger(low=1, high=2024)
    active_members = fuzzy.FuzzyInteger(low=1, high=500)

    core_business = FakerFI("sentence")
    core_business_fi = LazyAttribute(lambda i: i.core_business)
    core_business_en = FakerEN("sentence")
    core_business_sv = FakerSV("sentence")

    organisation_type = fuzzy.FuzzyChoice(choices=OrganizationTypeChoice.values)

    address = ForeignKeyFactory("tests.factories.AddressFactory", required=True)

    applications = ReverseForeignKeyFactory("tests.factories.ApplicationFactory")

    @classmethod
    def create_for_community_applicant(cls, **kwargs: Any) -> Organisation:
        defaults = {
            "name": "Test Community",
            "organisation_type": OrganizationTypeChoice.RELIGIOUS_COMMUNITY,
            "core_business": "Testing business",
            "identifier": None,
            **kwargs,
        }

        if "address" not in defaults:
            defaults.setdefault("address__street_address", "Org address")
            defaults.setdefault("address__post_code", "54321")
            defaults.setdefault("address__city", "City")

        return cls.create(**defaults)

    @classmethod
    def create_for_association_applicant(cls, **kwargs: Any) -> Organisation:
        defaults = {
            "name": "Test Association",
            "organisation_type": OrganizationTypeChoice.PUBLIC_ASSOCIATION,
            "core_business": "Testing business",
            "identifier": None,
            **kwargs,
        }

        if "address" not in defaults:
            defaults.setdefault("address__street_address", "Org address")
            defaults.setdefault("address__post_code", "54321")
            defaults.setdefault("address__city", "City")

        return cls.create(**defaults)

    @classmethod
    def create_for_company_applicant(cls, **kwargs: Any) -> Organisation:
        defaults = {
            "name": "Test Company",
            "organisation_type": OrganizationTypeChoice.COMPANY,
            "core_business": "Testing business",
            "identifier": "123456-0",
            **kwargs,
        }

        if "address" not in defaults:
            defaults.setdefault("address__street_address", "Org address")
            defaults.setdefault("address__post_code", "54321")
            defaults.setdefault("address__city", "City")

        return cls.create(**defaults)
