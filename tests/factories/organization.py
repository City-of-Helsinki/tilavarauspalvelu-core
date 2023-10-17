import datetime

import factory
from factory import fuzzy

from applications.choices import OrganizationTypeChoice
from applications.models import Organisation

from ._base import GenericDjangoModelFactory

__all__ = [
    "OrganisationFactory",
]


class OrganisationFactory(GenericDjangoModelFactory[Organisation]):
    class Meta:
        model = Organisation

    name = fuzzy.FuzzyText()
    identifier = fuzzy.FuzzyText()
    year_established = fuzzy.FuzzyInteger(low=1, high=datetime.date.today().year)
    address = factory.SubFactory("tests.factories.AddressFactory")
    active_members = fuzzy.FuzzyInteger(low=1, high=500)
    organisation_type = fuzzy.FuzzyChoice(choices=OrganizationTypeChoice.values)
    email = fuzzy.FuzzyText(suffix="@testingisbesthing.com")
