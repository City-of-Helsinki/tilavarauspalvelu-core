from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import Service, TermsOfUse
from .models.resource.model import Resource


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]


@register(Resource)
class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]
