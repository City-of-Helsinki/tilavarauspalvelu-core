from modeltranslation.translator import translator, TranslationOptions
from .models import ReservationUnit, Purpose


class ReservationUnitTranslationOptions(TranslationOptions):
    fields = ["name"]


class PurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(ReservationUnit, ReservationUnitTranslationOptions)
translator.register(Purpose, PurposeTranslationOptions)
