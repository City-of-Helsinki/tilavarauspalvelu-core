from datetime import date
from decimal import Decimal

from factory import SubFactory, post_generation
from factory.django import DjangoModelFactory
from factory.fuzzy import FuzzyChoice, FuzzyText

from reservation_units.models import PricingType
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


class TaxPercentageFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.TaxPercentage"

    value = FuzzyChoice(choices=(Decimal("10.0"), Decimal("14.0"), Decimal("24.0")))


class QualifierFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.Qualifier"

    name = FuzzyText()


class ReservationUnitCancellationRuleFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.ReservationUnitCancellationRule"

    name = FuzzyText()


class ReservationUnitFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.ReservationUnit"

    sku = FuzzyText()
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


class ReservationUnitImageFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.ReservationUnitImage"


class ReservationUnitPricingFactory(DjangoModelFactory):

    begins = date(2021, 1, 1)
    pricing_type = PricingType.PAID
    price_unit = "per_15_mins"
    lowest_price = 5
    highest_price = 10
    lowest_price_net = Decimal("5") / Decimal("1.10")
    highest_price_net = Decimal("10") / Decimal("1.10")
    tax_percentage = SubFactory(TaxPercentageFactory, value=10.0)
    status = "active"

    class Meta:
        model = "reservation_units.ReservationUnitPricing"


class KeywordCategoryFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.KeywordCategory"

    name = FuzzyText()


class KeywordGroupFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.KeywordGroup"

    name = FuzzyText()
    keyword_category = None


class KeywordFactory(DjangoModelFactory):
    class Meta:
        model = "reservation_units.Keyword"

    name = FuzzyText()
    keyword_group = None
