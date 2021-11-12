from modeltranslation.translator import TranslationOptions, translator

from .models import AbilityGroup, ReservationPurpose


class AbilityGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


class ReservationPurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(AbilityGroup, AbilityGroupTranslationOptions)
translator.register(ReservationPurpose, ReservationPurposeTranslationOptions)
