from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText


class DistrictFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.District"

    name = FuzzyText()


class RealEstateFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.RealEstate"


class BuildingFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.Building"


class UnitFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.Unit"


class SpaceFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.Space"

    name = FuzzyText()
    parent = None
    district = SubFactory(DistrictFactory)
    building = SubFactory(BuildingFactory)
    unit = SubFactory(UnitFactory)


class ServiceSectorFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.ServiceSector"

    name = FuzzyText()

    @post_generation
    def units(self, create, units, **kwargs):
        if not create or not units:
            return

        for unit in units:
            self.units.add(unit)


class LocationFactory(DjangoModelFactory):
    class Meta:
        model = "spaces.Location"
