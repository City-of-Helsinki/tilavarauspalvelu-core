from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyText

from spaces.tests.factories import UnitFactory


class EquipmentCategoryFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.EquipmentCategory"

    name = FuzzyText()


class EquipmentFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.Equipment"

    category = SubFactory(EquipmentCategoryFactory)


class ReservationUnitTypeFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.ReservationUnitType"

    name = FuzzyText()


class PurposeFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.Purpose"

    name = FuzzyText()


class ReservationUnitFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.ReservationUnit"

    name = FuzzyText()
    reservation_unit_type = SubFactory(ReservationUnitTypeFactory)
    unit = SubFactory(UnitFactory)

    @post_generation
    def spaces(self, create, spaces, **kwargs):
        if not create or not spaces:
            return

        for space in spaces:
            self.spaces.add(space)

    @post_generation
    def resources(self, create, resources, **kwargs):
        if not create or not resources:
            return

        for resource in resources:
            self.resources.add(resource)

    @post_generation
    def services(self, create, services, **kwargs):
        if not create or not services:
            return

        for service in services:
            self.services.add(service)

    @post_generation
    def purposes(self, create, purposes, **kwargs):
        if not create or not purposes:
            return

        for purpose in purposes:
            self.purposes.add(purpose)

    @post_generation
    def equipments(self, create, equipments, **kwargs):
        if not create or not equipments:
            return

        for equipment in equipments:
            self.equipments.add(equipment)
