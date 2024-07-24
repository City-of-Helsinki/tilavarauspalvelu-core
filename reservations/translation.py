from modeltranslation.translator import TranslationOptions, register

from reservations.models import AbilityGroup, ReservationCancelReason, ReservationDenyReason, ReservationPurpose


@register(AbilityGroup)
class AbilityGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationPurpose)
class ReservationPurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationCancelReason)
class ReservationCancelReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


@register(ReservationDenyReason)
class ReservationDenyReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]
