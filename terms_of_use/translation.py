from modeltranslation.translator import TranslationOptions, register

from terms_of_use.models import TermsOfUse


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]
