from modeltranslation.translator import TranslationOptions, translator

from .models import (
    AbilityGroup,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationPurpose,
)


class AbilityGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


class ReservationPurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


class ReservationCancelReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


class ReservationDenyReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


translator.register(AbilityGroup, AbilityGroupTranslationOptions)
translator.register(ReservationPurpose, ReservationPurposeTranslationOptions)
translator.register(ReservationCancelReason, ReservationCancelReasonTranslationOptions)
translator.register(ReservationDenyReason, ReservationDenyReasonTranslationOptions)
