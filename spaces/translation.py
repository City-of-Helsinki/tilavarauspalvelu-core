from modeltranslation.translator import TranslationOptions, register

from spaces.models import Building, Location, RealEstate, ServiceSector, Space, Unit, UnitGroup


@register(Space)
class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(UnitGroup)
class UnitGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Unit)
class UnitTranslationOptions(TranslationOptions):
    fields = ["name", "description", "short_description"]


@register(RealEstate)
class RealEstateTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Building)
class BuildingTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ServiceSector)
class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Location)
class LocationTranslationOptions(TranslationOptions):
    fields = ["address_street", "address_city"]
