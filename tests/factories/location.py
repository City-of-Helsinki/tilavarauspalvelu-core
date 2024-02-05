import factory

from spaces.models import Location

from ._base import GenericDjangoModelFactory

__all__ = [
    "LocationFactory",
]


class LocationFactory(GenericDjangoModelFactory[Location]):
    class Meta:
        model = Location

    address_street = factory.Faker("street_address")
    address_zip = factory.Faker("postcode")
    address_city = factory.Faker("city")

    space = factory.SubFactory("tests.factories.SpaceFactory")
    building = factory.SubFactory("tests.factories.BuildingFactory")
    real_estate = factory.SubFactory("tests.factories.RealEstateFactory")
    unit = factory.SubFactory("tests.factories.UnitFactory")

    coordinates = None
