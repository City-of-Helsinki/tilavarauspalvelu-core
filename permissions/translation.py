from modeltranslation.translator import TranslationOptions, register

from permissions.models import GeneralRoleChoice, ServiceSectorRoleChoice, UnitRoleChoice


@register(UnitRoleChoice)
class UnitRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]


@register(ServiceSectorRoleChoice)
class ServiceSectorRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]


@register(GeneralRoleChoice)
class GeneralRoleChoiceTranslationOptions(TranslationOptions):
    fields = ["verbose_name"]
