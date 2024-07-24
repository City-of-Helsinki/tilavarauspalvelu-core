from modeltranslation.translator import TranslationOptions, register

from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitType,
)


@register(ReservationUnit)
class ReservationUnitTranslationOptions(TranslationOptions):
    fields = [
        "name",
        "description",
        "terms_of_use",
        "reservation_pending_instructions",
        "reservation_confirmed_instructions",
        "reservation_cancelled_instructions",
    ]


@register(ReservationUnitType)
class ReservationUnitTypeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(KeywordCategory)
class KeywordCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(KeywordGroup)
class KeywordGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Keyword)
class KeywordTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Purpose)
class PurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Qualifier)
class QualifierTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Equipment)
class EquipmentTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(EquipmentCategory)
class EquipmentCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleTranslationOptions(TranslationOptions):
    fields = ["name"]
