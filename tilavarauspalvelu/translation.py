from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import Service, TermsOfUse


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]
