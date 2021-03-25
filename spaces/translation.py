from modeltranslation.translator import TranslationOptions, translator

from .models import District, Location, ServiceSector, Space, Unit


class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


class UnitTranslationOptions(TranslationOptions):
    fields = ["name", "description", "short_description"]


class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


class DistrictTranslationOptions(TranslationOptions):
    fields = ["name"]


class LocationTranslationOption(TranslationOptions):
    fields = ["address_street"]


translator.register(Space, SpaceTranslationOptions)
translator.register(Unit, UnitTranslationOptions)
translator.register(ServiceSector, SpaceTranslationOptions)
translator.register(District, DistrictTranslationOptions)
translator.register(Location, LocationTranslationOption)
