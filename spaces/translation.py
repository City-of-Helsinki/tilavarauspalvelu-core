from modeltranslation.translator import TranslationOptions, translator

from .models import District, ServiceSector, Space, Unit


class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


class UnitTranslationOptions(TranslationOptions):
    fields = ["name"]


class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


class DistrictTranslationoptions(TranslationOptions):
    fields = ["name"]


translator.register(Space, SpaceTranslationOptions)
translator.register(Unit, UnitTranslationOptions)
translator.register(ServiceSector, SpaceTranslationOptions)
translator.register(District, DistrictTranslationoptions)
