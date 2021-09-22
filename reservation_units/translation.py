from modeltranslation.translator import TranslationOptions, translator

from .models import Equipment, EquipmentCategory, Purpose, ReservationUnit


class ReservationUnitTranslationOptions(TranslationOptions):
    fields = ["name", "description"]


class PurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


class EquipmentTranslationOptions(TranslationOptions):
    fields = ["name"]


class EquipmentCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(ReservationUnit, ReservationUnitTranslationOptions)
translator.register(Purpose, PurposeTranslationOptions)
translator.register(Equipment, EquipmentTranslationOptions)
translator.register(EquipmentCategory, EquipmentCategoryTranslationOptions)
