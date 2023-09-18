from modeltranslation.translator import TranslationOptions, translator

from services.models import Service


class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Service, ServiceTranslationOptions)
