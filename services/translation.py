from modeltranslation.translator import TranslationOptions, register

from services.models import Service


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]
