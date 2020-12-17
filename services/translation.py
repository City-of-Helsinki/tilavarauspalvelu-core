from modeltranslation.translator import translator, TranslationOptions
from .models import Service


class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Service, ServiceTranslationOptions)
