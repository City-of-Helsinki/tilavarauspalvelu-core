from modeltranslation.translator import TranslationOptions, translator

from .models import Purpose, ReservationUnit


class ReservationUnitTranslationOptions(TranslationOptions):
    fields = ["name", "description"]


class PurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(ReservationUnit, ReservationUnitTranslationOptions)
translator.register(Purpose, PurposeTranslationOptions)
