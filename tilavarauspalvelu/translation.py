from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import Service


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]
