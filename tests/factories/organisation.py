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
