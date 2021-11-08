from modeltranslation.translator import TranslationOptions, register

from .models import TermsOfUse


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]
