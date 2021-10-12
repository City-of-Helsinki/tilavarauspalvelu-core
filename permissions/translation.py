from modeltranslation.translator import TranslationOptions, translator

from .models import GeneralRoleChoice, ServiceSectorRoleChoice, UnitRoleChoice


class UnitRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]


class ServiceSectorRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]


class GeneralRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]


translator.register(UnitRoleChoice, UnitRoleChoiceTranslationOptions)
translator.register(ServiceSectorRoleChoice, ServiceSectorRoleChoiceTranslationOptions)
translator.register(GeneralRoleChoice, GeneralRoleChoiceTranslationOptions)
