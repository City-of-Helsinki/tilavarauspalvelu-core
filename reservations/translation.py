from modeltranslation.translator import TranslationOptions, translator

from reservations.models import AbilityGroup, ReservationPurpose


class AbilityGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


class ReservationPurposeTranslationOption(TranslationOptions):
    fields = ["custom_purpose"]


translator.register(AbilityGroup, AbilityGroupTranslationOptions)
translator.register(ReservationPurpose, ReservationPurposeTranslationOption)
