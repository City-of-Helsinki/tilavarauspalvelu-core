from modeltranslation.translator import TranslationOptions, translator

from .models import (
    Building,
    District,
    Location,
    RealEstate,
    ServiceSector,
    Space,
    Unit,
    UnitGroup,
)


class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


class UnitGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


class UnitTranslationOptions(TranslationOptions):
    fields = ["name", "description", "short_description"]


class RealEstateTranslationOptions(TranslationOptions):
    fields = ["name"]


class BuildingTranslationOptions(TranslationOptions):
    fields = ["name"]


class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


class DistrictTranslationoptions(TranslationOptions):
    fields = ["name"]


class LocationTranslationOptions(TranslationOptions):
    fields = ["address_street", "address_city"]


translator.register(Space, SpaceTranslationOptions)
translator.register(UnitGroup, UnitGroupTranslationOptions)
translator.register(Unit, UnitTranslationOptions)
translator.register(RealEstate, RealEstateTranslationOptions)
translator.register(Building, BuildingTranslationOptions)
translator.register(ServiceSector, ServiceSectorTranslationOptions)
translator.register(District, DistrictTranslationoptions)
translator.register(Location, LocationTranslationOptions)
