from modeltranslation.translator import TranslationOptions, translator

from .models import Service


class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Service, ServiceTranslationOptions)
